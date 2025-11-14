import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock dependencies before any imports
vi.mock("which-pm-runs", () => ({
  default: vi.fn(),
}));
vi.mock("./base.ts", () => ({
  detectByPackageJson: vi.fn(),
}));

describe("pm-cli.cli", () => {
  let originalArgv: string[] = [];
  let originalExit: typeof process.exit = process.exit;
  let originalConsoleError: typeof console.error = console.error;
  let originalConsoleWarn: typeof console.warn = console.warn;
  let originalConsoleLog: typeof console.log = console.log;
  let mockExit: ReturnType<typeof vi.fn> = vi.fn();
  let mockConsoleError: typeof console.error = vi.fn();
  let mockConsoleWarn: typeof console.warn = vi.fn();
  let mockConsoleLog: typeof console.log = vi.fn();

  beforeEach(() => {
    originalArgv = [...process.argv];
    originalExit = process.exit;
    originalConsoleError = console.error;
    originalConsoleWarn = console.warn;
    originalConsoleLog = console.log;

    mockExit = vi.fn();
    mockConsoleError = vi.fn();
    mockConsoleWarn = vi.fn();
    mockConsoleLog = vi.fn();

    process.exit = mockExit as any;
    console.error = mockConsoleError;
    console.warn = mockConsoleWarn;
    console.log = mockConsoleLog;
  });

  afterEach(() => {
    process.argv = originalArgv;
    process.exit = originalExit;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    console.log = originalConsoleLog;
    vi.resetAllMocks();
    // Clear module cache to ensure fresh imports
    vi.resetModules();
  });

  describe("enable-shim command", () => {
    it("should create shim files for npm, yarn, and pnpm when enable-shim is called", async () => {
      // Mock process.argv to simulate "enable-shim" command
      process.argv = [
        "node",
        path.join(os.tmpdir(), "pm-cli.cli.ts"),
        "enable-shim",
      ];

      const argv1 = process.argv[1];
      if (!argv1) throw new Error("process.argv[1] is not defined");
      const installDirectory = path.dirname(argv1);

      const importMetaDirname = path.dirname(fileURLToPath(import.meta.url));
      const shimsDirectory = path.join(importMetaDirname, "shims");

      await import("./pm-cli.cli.ts");
      for (const item of ["npm", "yarn", "pnpm", "npx", "yarnpkg", "pnpx"]) {
        const link = await fs.readlink(path.join(installDirectory, item));
        expect(link).toBe(
          path.relative(
            installDirectory,
            path.join(shimsDirectory, `${item}.cli.ts`),
          ),
        );
      }

      // Clean up shim files
      for (const item of ["npm", "yarn", "pnpm", "npx", "yarnpkg", "pnpx"]) {
        await fs.unlink(path.join(installDirectory, item));
      }
    });
  });

  describe("check-pm command", () => {
    it("should pass when package manager matches exactly", async () => {
      const { detectByPackageJson } = await import("./base.ts");
      const whichPmRuns = (await import("which-pm-runs")).default;

      vi.mocked(detectByPackageJson).mockResolvedValue({
        name: "pnpm",
        version: "10.15.1",
      });
      vi.mocked(whichPmRuns).mockReturnValue({
        name: "pnpm",
        version: "10.15.1",
      });

      process.argv = ["node", "pm-cli.cli.ts", "check-pm"];

      await import("./pm-cli.cli.ts");

      expect(mockExit).not.toHaveBeenCalled();
      expect(mockConsoleError).not.toHaveBeenCalled();
      expect(mockConsoleWarn).not.toHaveBeenCalled();
    });

    it("should pass with warning when package manager name matches but version differs", async () => {
      const { detectByPackageJson } = await import("./base.ts");
      const whichPmRuns = (await import("which-pm-runs")).default;

      vi.mocked(detectByPackageJson).mockResolvedValue({
        name: "pnpm",
        version: "10.15.1",
      });
      vi.mocked(whichPmRuns).mockReturnValue({
        name: "pnpm",
        version: "10.11.0",
      });

      process.argv = ["node", "pm-cli.cli.ts", "check-pm"];

      await import("./pm-cli.cli.ts");

      expect(mockExit).not.toHaveBeenCalled();
      expect(mockConsoleError).not.toHaveBeenCalled();
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        "⚠️  Package manager version mismatch:",
      );
      expect(mockConsoleWarn).toHaveBeenCalledWith("  Expected: pnpm@10.15.1");
      expect(mockConsoleWarn).toHaveBeenCalledWith("  Current:  pnpm@10.11.0");
    });

    it("should pass when package manager name matches and no version specified", async () => {
      const { detectByPackageJson } = await import("./base.ts");
      const whichPmRuns = (await import("which-pm-runs")).default;

      vi.mocked(detectByPackageJson).mockResolvedValue({ name: "npm" });
      vi.mocked(whichPmRuns).mockReturnValue({
        name: "npm",
        version: "10.8.2",
      });

      process.argv = ["node", "pm-cli.cli.ts", "check-pm"];

      await import("./pm-cli.cli.ts");

      expect(mockExit).not.toHaveBeenCalled();
      expect(mockConsoleError).not.toHaveBeenCalled();
      expect(mockConsoleWarn).not.toHaveBeenCalled();
    });

    it("should exit with error when no package manager is configured", async () => {
      const { detectByPackageJson } = await import("./base.ts");

      vi.mocked(detectByPackageJson).mockResolvedValue(undefined);

      process.argv = ["node", "pm-cli.cli.ts", "check-pm"];

      // Mock process.exit to throw an error so we can catch it
      const exitError = new Error("process.exit called");
      mockExit.mockImplementation(() => {
        throw exitError;
      });

      await expect(import("./pm-cli.cli.ts")).rejects.toThrow(
        "process.exit called",
      );

      expect(mockExit).toHaveBeenCalledWith(1);
      expect(mockConsoleError).toHaveBeenCalledWith(
        "❌ No package manager configured in package.json. Please configure a package manager using one of the following methods:",
      );
      expect(mockConsoleError).toHaveBeenCalledWith(
        '  - Add "packageManager" field in package.json',
      );
      expect(mockConsoleError).toHaveBeenCalledWith(
        '  - Add "devEngines.packageManager" field in package.json',
      );
      expect(mockConsoleError).toHaveBeenCalledWith(
        '  - Add package manager in "engines" field in package.json',
      );
    });

    it("should exit with error when current package manager cannot be detected", async () => {
      const { detectByPackageJson } = await import("./base.ts");
      const whichPmRuns = (await import("which-pm-runs")).default;

      vi.mocked(detectByPackageJson).mockResolvedValue({
        name: "pnpm",
        version: "10.15.1",
      });
      vi.mocked(whichPmRuns).mockReturnValue(undefined);

      process.argv = ["node", "pm-cli.cli.ts", "check-pm"];

      // Mock process.exit to throw an error so we can catch it
      const exitError = new Error("process.exit called");
      mockExit.mockImplementation(() => {
        throw exitError;
      });

      await expect(import("./pm-cli.cli.ts")).rejects.toThrow(
        "process.exit called",
      );

      expect(mockExit).toHaveBeenCalledWith(1);
      expect(mockConsoleError).toHaveBeenCalledWith(
        "❌ Unable to detect the current package manager",
      );
    });

    it("should exit with error when package manager names don't match", async () => {
      const { detectByPackageJson } = await import("./base.ts");
      const whichPmRuns = (await import("which-pm-runs")).default;

      vi.mocked(detectByPackageJson).mockResolvedValue({
        name: "pnpm",
        version: "10.15.1",
      });
      vi.mocked(whichPmRuns).mockReturnValue({
        name: "npm",
        version: "10.8.2",
      });

      process.argv = ["node", "pm-cli.cli.ts", "check-pm"];

      // Mock process.exit to throw an error so we can catch it
      const exitError = new Error("process.exit called");
      mockExit.mockImplementation(() => {
        throw exitError;
      });

      await expect(import("./pm-cli.cli.ts")).rejects.toThrow(
        "process.exit called",
      );

      expect(mockExit).toHaveBeenCalledWith(1);
      expect(mockConsoleError).toHaveBeenCalledWith(
        "❌ Package manager mismatch:",
      );
      expect(mockConsoleError).toHaveBeenCalledWith("  Expected: pnpm");
      expect(mockConsoleError).toHaveBeenCalledWith("  Current:  npm");
    });

    it("should handle case when current package manager has no version", async () => {
      const { detectByPackageJson } = await import("./base.ts");
      const whichPmRuns = (await import("which-pm-runs")).default;

      vi.mocked(detectByPackageJson).mockResolvedValue({
        name: "yarn",
        version: "1.22.22",
      });
      vi.mocked(whichPmRuns).mockReturnValue({ name: "yarn", version: "" });

      process.argv = ["node", "pm-cli.cli.ts", "check-pm"];

      await import("./pm-cli.cli.ts");

      expect(mockExit).not.toHaveBeenCalled();
      expect(mockConsoleError).not.toHaveBeenCalled();
      expect(mockConsoleWarn).not.toHaveBeenCalled();
    });

    it("should handle case when expected package manager has no version", async () => {
      const { detectByPackageJson } = await import("./base.ts");
      const whichPmRuns = (await import("which-pm-runs")).default;

      vi.mocked(detectByPackageJson).mockResolvedValue({ name: "yarn" });
      vi.mocked(whichPmRuns).mockReturnValue({
        name: "yarn",
        version: "1.22.22",
      });

      process.argv = ["node", "pm-cli.cli.ts", "check-pm"];

      await import("./pm-cli.cli.ts");

      expect(mockExit).not.toHaveBeenCalled();
      expect(mockConsoleError).not.toHaveBeenCalled();
      expect(mockConsoleWarn).not.toHaveBeenCalled();
    });
  });

  describe("--version option", () => {
    it("should output the package version", async () => {
      process.argv = ["node", "pm-cli.cli.ts", "--version"];

      await import("./pm-cli.cli.ts");

      const packageJson = JSON.parse(
        await fs.readFile(path.join(process.cwd(), "package.json"), "utf8"),
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.any(String));
      expect(mockConsoleLog).toHaveBeenCalledWith(packageJson.version);
    });
  });
});
