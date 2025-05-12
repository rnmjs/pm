import childProcess from "node:child_process";
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { main } from "./main.ts";

// This is needed because vitest does not support import.meta.resolve.
// When vitest supports import.meta.resolve, this mock can be removed.
vi.mock("./import-meta-resolve.ts", () => ({
  importMetaResolve: vi
    .fn()
    .mockImplementation(
      (specifier) =>
        `file://${createRequire(import.meta.url).resolve(specifier)}`,
    ),
}));

describe("main", () => {
  const spawnMock = vi.spyOn(childProcess, "spawn").mockImplementation(
    () =>
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      ({
        on: (event: string, listener: (...args: any[]) => void) => {
          if (event === "close") listener(0);
        },
        kill: () => {
          // do nothing
        },
      }) as childProcess.ChildProcess,
  );
  const cwd = process.cwd();
  beforeEach(() => {
    spawnMock.mockClear();
    process.chdir(cwd);
  });

  const tmpDir = path.resolve(os.tmpdir(), "pm-test");
  beforeAll(async () => {
    await fs.mkdir(tmpDir, { recursive: true });
  });
  afterAll(async () => {
    await fs.rm(tmpDir, { recursive: true });
  });

  it("should cause error in a directory without package.json", async () => {
    process.chdir(process.env["HOME"] ?? "/");
    const result = main({});
    await expect(result).rejects.toThrowError(/^No package.json found\.$/);
  });

  it("should detect by packageManager field", async () => {
    await fs.mkdir(path.join(tmpDir, "detect-by-package-manager"));
    process.chdir(path.join(tmpDir, "detect-by-package-manager"));
    await fs.writeFile(
      "package.json",
      JSON.stringify({
        packageManager: "yarn@1.1.1+foobar",
      }),
      "utf8",
    );
    process.argv = ["node", "main.js", "--help"];

    const status = await main({
      onDetected: (detected) => {
        expect(detected?.name).toBe("yarn");
        expect(detected?.version).toBe("1.1.1");
      },
    });

    expect(status).toBe(0);
    expect(childProcess.spawn).toHaveBeenCalledOnce();
    expect(vi.mocked(childProcess.spawn).mock.calls.length).toBe(1);
    vi.mocked(childProcess.spawn).mock.calls.forEach((call) => {
      expect(call[0]).toBe(
        path.resolve(
          createRequire(import.meta.url).resolve("corepack/package.json"),
          "..",
          "dist",
          "corepack.js",
        ),
      );
      expect(call[1]).toEqual(["yarn", "--help"]);
      expect(call[2]).toBeInstanceOf(Object);
    });
  });

  it("should detect by devEngines field", async () => {
    await fs.mkdir(path.join(tmpDir, "detect-by-dev-engines"));
    process.chdir(path.join(tmpDir, "detect-by-dev-engines"));
    await fs.writeFile(
      "package.json",
      JSON.stringify({
        devEngines: {
          packageManager: {
            name: "npm",
            version: "1.2.3+foobarbaz",
          },
        },
      }),
      "utf8",
    );
    process.argv = ["node", "main.js", "--help"];

    const status = await main({
      onDetected: (detected) => {
        expect(detected?.name).toBe("npm");
        expect(detected?.version).toBe("1.2.3");
      },
    });

    expect(status).toBe(0);
    expect(childProcess.spawn).toHaveBeenCalledOnce();
    expect(vi.mocked(childProcess.spawn).mock.calls.length).toBe(1);
    vi.mocked(childProcess.spawn).mock.calls.forEach((call) => {
      expect(call[0]).toBe(
        path.resolve(
          createRequire(import.meta.url).resolve("corepack/package.json"),
          "..",
          "dist",
          "corepack.js",
        ),
      );
      expect(call[1]).toEqual(["npm", "--help"]);
      expect(call[2]).toBeInstanceOf(Object);
    });
  });

  it("should detect by engines field", async () => {
    await fs.mkdir(path.join(tmpDir, "detect-by-engines"));
    process.chdir(path.join(tmpDir, "detect-by-engines"));
    await fs.writeFile(
      "package.json",
      JSON.stringify({
        engines: { pnpm: "9.5.5" },
      }),
      "utf8",
    );
    process.argv = ["node", "main.js", "--help"];

    const status = await main({
      onDetected: (detected) => {
        expect(detected?.name).toBe("pnpm");
        expect(detected?.version).toBeUndefined();
      },
    });

    expect(status).toBe(0);
    expect(childProcess.spawn).toHaveBeenCalledOnce();
    expect(vi.mocked(childProcess.spawn).mock.calls.length).toBe(1);
    vi.mocked(childProcess.spawn).mock.calls.forEach((call) => {
      expect(call[0]).toBe(
        path.resolve(
          createRequire(import.meta.url).resolve("corepack/package.json"),
          "..",
          "dist",
          "corepack.js",
        ),
      );
      expect(call[1]).toEqual(["pnpm", "--help"]);
      expect(call[2]).toBeInstanceOf(Object);
    });
  });

  it("should detect by package.json first instead of lock files", async () => {
    await fs.mkdir(path.join(tmpDir, "detect-by-package-json"));
    await fs.mkdir(path.join(tmpDir, "detect-by-package-json", "nested"));
    await fs.writeFile(
      path.join(tmpDir, "detect-by-package-json", "package.json"),
      '{"packageManager": "yarn@1.10.0"}',
    );
    await fs.writeFile(
      path.join(tmpDir, "detect-by-package-json", "nested", "package.json"),
      "{}",
    );
    await fs.writeFile(
      path.join(tmpDir, "detect-by-package-json", "nested", "pnpm-lock.yaml"),
      "",
    );

    process.chdir(path.join(tmpDir, "detect-by-package-json", "nested"));
    process.argv = ["node", "main.js", "--help"];

    const status = await main({
      onDetected: (detected) => {
        expect(detected?.name).toBe("yarn");
        expect(detected?.version).toBe("1.10.0");
      },
    });
    expect(status).toBe(0);
    expect(childProcess.spawn).toHaveBeenCalledOnce();
    expect(vi.mocked(childProcess.spawn).mock.calls.length).toBe(1);
    vi.mocked(childProcess.spawn).mock.calls.forEach((call) => {
      expect(call[0]).toBe(
        path.resolve(
          createRequire(import.meta.url).resolve("corepack/package.json"),
          "..",
          "dist",
          "corepack.js",
        ),
      );
      expect(call[1]).toEqual(["yarn", "--help"]);
      expect(call[2]).toBeInstanceOf(Object);
    });
  });

  it("should detect by lock file", async () => {
    await fs.mkdir(path.join(tmpDir, "detect-by-lock-file"));
    process.chdir(path.join(tmpDir, "detect-by-lock-file"));
    await fs.writeFile("package.json", JSON.stringify({}), "utf8");
    await fs.writeFile("yarn.lock", "", "utf8");
    process.argv = ["node", "main.js", "--help"];

    const status = await main({
      onDetected: (detected) => {
        expect(detected?.name).toBe("yarn");
        expect(detected?.version).toBeUndefined();
      },
    });

    expect(status).toBe(0);
    expect(childProcess.spawn).toHaveBeenCalledOnce();
    expect(vi.mocked(childProcess.spawn).mock.calls.length).toBe(1);
    vi.mocked(childProcess.spawn).mock.calls.forEach((call) => {
      expect(call[0]).toBe(
        path.resolve(
          createRequire(import.meta.url).resolve("corepack/package.json"),
          "..",
          "dist",
          "corepack.js",
        ),
      );
      expect(call[1]).toEqual(["yarn", "--help"]);
      expect(call[2]).toBeInstanceOf(Object);
    });
  });

  it("should crash when detecting multi lock fils", async () => {
    await fs.mkdir(path.join(tmpDir, "detect-multi-lock-files"));
    await fs.mkdir(path.join(tmpDir, "detect-multi-lock-files", "nested"));
    process.chdir(path.join(tmpDir, "detect-multi-lock-files", "nested"));
    await fs.writeFile("package.json", JSON.stringify({}), "utf8");
    await fs.writeFile("yarn.lock", "", "utf8");
    await fs.writeFile(path.join("..", "package-lock.json"), "", "utf8");

    process.argv = ["node", "main.js", "--help"];

    const result = main({});

    await expect(result).rejects.toThrowError(
      /^Multiple lock files found. Please remove one of them\.$/,
    );
    expect(childProcess.spawn).toHaveBeenCalledTimes(0);
  });

  it("should detect and fallback to npm", async () => {
    await fs.mkdir(path.join(tmpDir, "detect-and-fallback"));
    process.chdir(path.join(tmpDir, "detect-and-fallback"));
    await fs.writeFile("package.json", JSON.stringify({}), "utf8");
    process.argv = ["node", "main.js", "--help"];

    const status = await main({
      onDetected: (detected) => {
        expect(detected).toBeUndefined();
      },
    });

    expect(status).toBe(0);
    expect(childProcess.spawn).toHaveBeenCalledOnce();
    expect(vi.mocked(childProcess.spawn).mock.calls.length).toBe(1);
    vi.mocked(childProcess.spawn).mock.calls.forEach((call) => {
      expect(call[0]).toBe(
        path.resolve(
          createRequire(import.meta.url).resolve("corepack/package.json"),
          "..",
          "dist",
          "corepack.js",
        ),
      );
      expect(call[1]).toEqual(["npm", "--help"]);
      expect(call[2]).toBeInstanceOf(Object);
    });
  });

  it("should detect pnpm in current project", async () => {
    process.argv = ["node", "main.js", "--help"];

    const status = await main({
      onDetected: (detected) => {
        expect(detected?.name).toBe("pnpm");
      },
    });

    expect(status).toBe(0);
    expect(childProcess.spawn).toHaveBeenCalledOnce();
    expect(vi.mocked(childProcess.spawn).mock.calls.length).toBe(1);
    vi.mocked(childProcess.spawn).mock.calls.forEach((call) => {
      expect(call[0]).toBe(
        path.resolve(
          createRequire(import.meta.url).resolve("corepack/package.json"),
          "..",
          "dist",
          "corepack.js",
        ),
      );
      expect(call[1]).toEqual(["pnpm", "--help"]);
      expect(call[2]).toBeInstanceOf(Object);
    });
  });
});
