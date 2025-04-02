import type { Buffer } from "node:buffer";
import childProcess from "node:child_process";
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { importMetaResolve } from "./import-meta-resolve.ts";
import { main } from "./main.ts";

describe("main", () => {
  vi.mock("./import-meta-resolve.ts", () => ({
    importMetaResolve: vi
      .fn()
      .mockImplementation(
        (specifier) =>
          `file://${createRequire(import.meta.url).resolve(specifier)}`,
      ),
  }));
  const importMetaResolveMock = vi.mocked(importMetaResolve);
  const spawnSyncMock = vi.spyOn(childProcess, "spawnSync");
  const cwd = process.cwd();
  beforeEach(() => {
    importMetaResolveMock.mockClear();
    spawnSyncMock.mockClear();
    process.chdir(cwd);
  });

  const tmpDir = path.resolve(os.tmpdir(), "pm-test");
  beforeAll(async () => {
    await fs.mkdir(tmpDir, { recursive: true });
  });
  afterAll(async () => {
    await fs.rm(tmpDir, { recursive: true });
  });

  it("corepack bin should be a file", async () => {
    const pkgJsonPath = fileURLToPath(
      importMetaResolve("corepack/package.json"),
    );
    const binPath = JSON.parse(await fs.readFile(pkgJsonPath, "utf8")).bin
      .corepack;

    expect((await fs.stat(pkgJsonPath)).isFile()).toBe(true);
    expect(typeof binPath).toBe("string");
    expect(
      (
        await fs.stat(path.resolve(path.dirname(pkgJsonPath), binPath))
      ).isFile(),
    ).toBe(true);
  });

  it("should cause error in a directory without package.json", () => {
    process.chdir(process.env["HOME"] ?? "/");
    const result = main({});
    expect(result).rejects.toThrowError(/^No package.json found\.$/);
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
    spawnSyncMock.mockReturnValue({
      status: 0,
    } as childProcess.SpawnSyncReturns<Buffer>);
    process.argv = ["node", "main.js", "--help"];

    const status = await main({
      onDetected: (detected) => {
        expect(detected?.name).toBe("yarn");
        expect(detected?.version).toBe("1.1.1");
      },
    });

    expect(status).toBe(0);
    expect(childProcess.spawnSync).toHaveBeenCalled();
    expect(childProcess.spawnSync).toBeCalledWith(
      path.resolve(
        createRequire(import.meta.url).resolve("corepack/package.json"),
        "..",
        "dist",
        "corepack.js",
      ),
      ["yarn", "--help"],
      { stdio: "inherit", env: { ...process.env } },
    );
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
            version: "1.2.3",
          },
        },
      }),
      "utf8",
    );
    spawnSyncMock.mockReturnValue({
      status: 0,
    } as childProcess.SpawnSyncReturns<Buffer>);
    process.argv = ["node", "main.js", "--help"];

    const status = await main({
      onDetected: (detected) => {
        expect(detected?.name).toBe("npm");
        expect(detected?.version).toBe("1.2.3");
      },
    });

    expect(status).toBe(0);
    expect(childProcess.spawnSync).toHaveBeenCalled();
    expect(childProcess.spawnSync).toBeCalledWith(
      path.resolve(
        createRequire(import.meta.url).resolve("corepack/package.json"),
        "..",
        "dist",
        "corepack.js",
      ),
      ["npm", "--help"],
      { stdio: "inherit", env: { ...process.env } },
    );
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
    spawnSyncMock.mockReturnValue({
      status: 0,
    } as childProcess.SpawnSyncReturns<Buffer>);
    process.argv = ["node", "main.js", "--help"];

    const status = await main({
      onDetected: (detected) => {
        expect(detected?.name).toBe("pnpm");
        expect(detected?.version).toBeUndefined();
      },
    });

    expect(status).toBe(0);
    expect(childProcess.spawnSync).toHaveBeenCalled();
    expect(childProcess.spawnSync).toBeCalledWith(
      path.resolve(
        createRequire(import.meta.url).resolve("corepack/package.json"),
        "..",
        "dist",
        "corepack.js",
      ),
      ["pnpm", "--help"],
      { stdio: "inherit", env: { ...process.env } },
    );
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
    spawnSyncMock.mockReturnValue({
      status: 0,
    } as childProcess.SpawnSyncReturns<Buffer>);
    process.argv = ["node", "main.js", "--help"];

    const status = await main({
      onDetected: (detected) => {
        expect(detected?.name).toBe("yarn");
        expect(detected?.version).toBe("1.10.0");
      },
    });
    expect(status).toBe(0);
    expect(childProcess.spawnSync).toHaveBeenCalled();
    expect(childProcess.spawnSync).toBeCalledWith(
      path.resolve(
        createRequire(import.meta.url).resolve("corepack/package.json"),
        "..",
        "dist",
        "corepack.js",
      ),
      ["yarn", "--help"],
      { stdio: "inherit", env: { ...process.env } },
    );
  });

  it("should detect by lock file", async () => {
    await fs.mkdir(path.join(tmpDir, "detect-by-lock-file"));
    process.chdir(path.join(tmpDir, "detect-by-lock-file"));
    await fs.writeFile("package.json", JSON.stringify({}), "utf8");
    await fs.writeFile("yarn.lock", "", "utf8");
    spawnSyncMock.mockReturnValue({
      status: 0,
    } as childProcess.SpawnSyncReturns<Buffer>);
    process.argv = ["node", "main.js", "--help"];

    const status = await main({
      onDetected: (detected) => {
        expect(detected?.name).toBe("yarn");
        expect(detected?.version).toBeUndefined();
      },
    });

    expect(status).toBe(0);
    expect(childProcess.spawnSync).toHaveBeenCalled();
    expect(childProcess.spawnSync).toBeCalledWith(
      path.resolve(
        createRequire(import.meta.url).resolve("corepack/package.json"),
        "..",
        "dist",
        "corepack.js",
      ),
      ["yarn", "--help"],
      { stdio: "inherit", env: { ...process.env } },
    );
  });

  it("should crash when detecting multi lock fils", async () => {
    await fs.mkdir(path.join(tmpDir, "detect-multi-lock-files"));
    await fs.mkdir(path.join(tmpDir, "detect-multi-lock-files", "nested"));
    process.chdir(path.join(tmpDir, "detect-multi-lock-files", "nested"));
    await fs.writeFile("package.json", JSON.stringify({}), "utf8");
    await fs.writeFile("yarn.lock", "", "utf8");
    await fs.writeFile(path.join("..", "package-lock.json"), "", "utf8");

    spawnSyncMock.mockReturnValue({
      status: 0,
    } as childProcess.SpawnSyncReturns<Buffer>);
    process.argv = ["node", "main.js", "--help"];

    const result = main({});

    expect(result).rejects.toThrowError(
      /^Multiple lock files found. Please remove one of them\.$/,
    );
    expect(childProcess.spawnSync).toHaveBeenCalledTimes(0);
  });

  it("should detect and fallback to npm", async () => {
    await fs.mkdir(path.join(tmpDir, "detect-and-fallback"));
    process.chdir(path.join(tmpDir, "detect-and-fallback"));
    await fs.writeFile("package.json", JSON.stringify({}), "utf8");
    spawnSyncMock.mockReturnValue({
      status: 0,
    } as childProcess.SpawnSyncReturns<Buffer>);
    process.argv = ["node", "main.js", "--help"];

    const status = await main({
      onDetected: (detected) => {
        expect(detected).toBeUndefined();
      },
    });

    expect(status).toBe(0);
    expect(childProcess.spawnSync).toHaveBeenCalled();
    expect(childProcess.spawnSync).toBeCalledWith(
      path.resolve(
        createRequire(import.meta.url).resolve("corepack/package.json"),
        "..",
        "dist",
        "corepack.js",
      ),
      ["npm", "--help"],
      { stdio: "inherit", env: { ...process.env } },
    );
  });

  it("should detect pnpm in current project", async () => {
    spawnSyncMock.mockReturnValue({
      status: 1,
    } as childProcess.SpawnSyncReturns<Buffer>);
    process.argv = ["node", "main.js", "--help"];

    const status = await main({
      onDetected: (detected) => {
        expect(detected?.name).toBe("pnpm");
      },
    });

    expect(status).toBe(1);
    expect(childProcess.spawnSync).toHaveBeenCalled();
    expect(childProcess.spawnSync).toBeCalledWith(
      path.resolve(
        createRequire(import.meta.url).resolve("corepack/package.json"),
        "..",
        "dist",
        "corepack.js",
      ),
      ["pnpm", "--help"],
      { stdio: "inherit", env: { ...process.env } },
    );
  });
});
