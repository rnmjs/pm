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
import { run } from "./base.ts";
import { defaultVersions } from "./constants.ts";
import { detect } from "./utils/detector.ts";

describe("base", () => {
  const spawnMock = vi.spyOn(childProcess, "spawn").mockImplementation(
    () =>
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- optimize it later
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

  it("should not cause error in a directory without package.json", async () => {
    process.chdir(process.env["HOME"] ?? "/");
    const result = await detect();
    expect(result).toBeUndefined();
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

    const detected = await detect();
    expect(detected?.name).toBe("yarn");
    expect(detected?.version).toBe("1.1.1");
    const status = await run(detected, process.argv.slice(2));

    expect(status).toBe(0);
    expect(childProcess.spawn).toHaveBeenCalledOnce();
    expect(vi.mocked(childProcess.spawn).mock.calls.length).toBe(1);
    vi.mocked(childProcess.spawn).mock.calls.forEach((call) => {
      expect(call[0]).toBe(process.execPath);
      expect(call[1]).toEqual([
        path.resolve(
          createRequire(import.meta.url).resolve("corepack/package.json"),
          "..",
          "dist",
          "corepack.js",
        ),
        "yarn@1.1.1",
        "--help",
      ]);
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

    const detected = await detect();
    expect(detected?.name).toBe("npm");
    expect(detected?.version).toBe("1.2.3");
    const status = await run(detected, process.argv.slice(2));

    expect(status).toBe(0);
    expect(childProcess.spawn).toHaveBeenCalledOnce();
    expect(vi.mocked(childProcess.spawn).mock.calls.length).toBe(1);
    vi.mocked(childProcess.spawn).mock.calls.forEach((call) => {
      expect(call[0]).toBe(process.execPath);
      expect(call[1]).toEqual([
        path.resolve(
          createRequire(import.meta.url).resolve("corepack/package.json"),
          "..",
          "dist",
          "corepack.js",
        ),
        "npm@1.2.3",
        "--help",
      ]);
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

    const detected = await detect();
    expect(detected?.name).toBe("pnpm");
    expect(detected?.version).toBeUndefined();
    const status = await run(detected, process.argv.slice(2));

    expect(status).toBe(0);
    expect(childProcess.spawn).toHaveBeenCalledOnce();
    expect(vi.mocked(childProcess.spawn).mock.calls.length).toBe(1);
    vi.mocked(childProcess.spawn).mock.calls.forEach((call) => {
      expect(call[0]).toBe(process.execPath);
      expect(call[1]).toEqual([
        path.resolve(
          createRequire(import.meta.url).resolve("corepack/package.json"),
          "..",
          "dist",
          "corepack.js",
        ),
        `pnpm@${defaultVersions.pnpm}`,
        "--help",
      ]);
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

    const detected = await detect();
    expect(detected?.name).toBe("yarn");
    expect(detected?.version).toBe("1.10.0");
    const status = await run(detected, process.argv.slice(2));

    expect(status).toBe(0);
    expect(childProcess.spawn).toHaveBeenCalledOnce();
    expect(vi.mocked(childProcess.spawn).mock.calls.length).toBe(1);
    vi.mocked(childProcess.spawn).mock.calls.forEach((call) => {
      expect(call[0]).toBe(process.execPath);
      expect(call[1]).toEqual([
        path.resolve(
          createRequire(import.meta.url).resolve("corepack/package.json"),
          "..",
          "dist",
          "corepack.js",
        ),
        "yarn@1.10.0",
        "--help",
      ]);
      expect(call[2]).toBeInstanceOf(Object);
    });
  });

  it("should detect by lock file", async () => {
    await fs.mkdir(path.join(tmpDir, "detect-by-lock-file"));
    process.chdir(path.join(tmpDir, "detect-by-lock-file"));
    await fs.writeFile("package.json", JSON.stringify({}), "utf8");
    await fs.writeFile("yarn.lock", "", "utf8");
    process.argv = ["node", "main.js", "--help"];

    const detected = await detect();
    expect(detected?.name).toBe("yarn");
    expect(detected?.version).toBeUndefined();
    const status = await run(detected, process.argv.slice(2));

    expect(status).toBe(0);
    expect(childProcess.spawn).toHaveBeenCalledOnce();
    expect(vi.mocked(childProcess.spawn).mock.calls.length).toBe(1);
    vi.mocked(childProcess.spawn).mock.calls.forEach((call) => {
      expect(call[0]).toBe(process.execPath);
      expect(call[1]).toEqual([
        path.resolve(
          createRequire(import.meta.url).resolve("corepack/package.json"),
          "..",
          "dist",
          "corepack.js",
        ),
        `yarn@${defaultVersions.yarn}`,
        "--help",
      ]);
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

    const result = detect();

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

    const detected = await detect();
    expect(detected).toBeUndefined();
    const status = await run(detected, process.argv.slice(2));

    expect(status).toBe(0);
    expect(childProcess.spawn).toHaveBeenCalledOnce();
    expect(vi.mocked(childProcess.spawn).mock.calls.length).toBe(1);
    vi.mocked(childProcess.spawn).mock.calls.forEach((call) => {
      expect(call[0]).toBe(process.execPath);
      expect(call[1]).toEqual([
        path.resolve(
          createRequire(import.meta.url).resolve("corepack/package.json"),
          "..",
          "dist",
          "corepack.js",
        ),
        `npm@${defaultVersions.npm}`,
        "--help",
      ]);
      expect(call[2]).toBeInstanceOf(Object);
    });
  });

  it("should detect pnpm in current project", async () => {
    process.argv = ["node", "main.js", "--help"];

    const detected = await detect();
    expect(detected?.name).toBe("pnpm");
    const status = await run(detected, process.argv.slice(2));

    expect(status).toBe(0);
    expect(childProcess.spawn).toHaveBeenCalledOnce();
    expect(vi.mocked(childProcess.spawn).mock.calls.length).toBe(1);
    vi.mocked(childProcess.spawn).mock.calls.forEach((call) => {
      expect(call[0]).toBe(process.execPath);
      expect(call[1]).toEqual([
        path.resolve(
          createRequire(import.meta.url).resolve("corepack/package.json"),
          "..",
          "dist",
          "corepack.js",
        ),
        "pnpm@10.23.0",
        "--help",
      ]);
      expect(call[2]).toBeInstanceOf(Object);
    });
  });
});
