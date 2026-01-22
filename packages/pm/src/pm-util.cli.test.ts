import childProcess from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { getPackageJson } from "./common.ts";

const packageJson = await getPackageJson();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cliPath = path.join(__dirname, "pm-util.cli.ts");

describe("pm-util.cli", () => {
  describe("--version", () => {
    it("should display version with --version flag", () => {
      const output = childProcess
        .execSync(`node ${cliPath} --version`, {
          encoding: "utf8",
        })
        .trim();
      expect(output).toBe(packageJson.version);
    });

    it("should display version with -v flag", () => {
      const output = childProcess
        .execSync(`node ${cliPath} -v`, {
          encoding: "utf8",
        })
        .trim();
      expect(output).toBe(packageJson.version);
    });
  });

  describe("help", () => {
    it("should display help message when no arguments provided", () => {
      const output = childProcess.execSync(`node ${cliPath}`, {
        encoding: "utf8",
      });
      expect(output).toContain("Usage:");
      expect(output).toContain("pm-util enable-shim");
      expect(output).toContain("pm-util check-pm");
    });

    it("should display help message for unknown command", () => {
      const output = childProcess.execSync(`node ${cliPath} unknown`, {
        encoding: "utf8",
      });
      expect(output).toContain("Usage:");
      expect(output).toContain("pm-util enable-shim");
      expect(output).toContain("pm-util check-pm");
    });
  });

  describe("enable-shim", () => {
    const shimFiles = ["npm", "npx", "yarn", "yarnpkg", "pnpm", "pnpx"];

    afterEach(() => {
      // Clean up generated shim files in the actual install directory
      for (const shimName of shimFiles) {
        const shimPath = path.join(__dirname, shimName);
        if (fs.existsSync(shimPath)) {
          fs.unlinkSync(shimPath);
        }
      }
    });

    it("should create shim files for all package managers by default", () => {
      // Run enable-shim command
      childProcess.execSync(`node ${cliPath} enable-shim`, {
        encoding: "utf8",
      });

      // Check if all shim files are created in the CLI directory
      for (const shimName of shimFiles) {
        const shimPath = path.join(__dirname, shimName);
        expect(fs.existsSync(shimPath)).toBe(true);

        // Check if it's a symbolic link
        const stats = fs.lstatSync(shimPath);
        expect(stats.isSymbolicLink()).toBe(true);

        // Check if the symlink points to the correct shim file
        const linkTarget = fs.readlinkSync(shimPath);
        const expectedTarget = path.join("shims", `${shimName}.cli.ts`);
        expect(linkTarget).toBe(expectedTarget);
      }
    });

    it("should create shim files for specific package managers", () => {
      // Run enable-shim command for npm only
      childProcess.execSync(`node ${cliPath} enable-shim npm`, {
        encoding: "utf8",
      });

      // Check if npm and npx shim files are created
      const npmPath = path.join(__dirname, "npm");
      const npxPath = path.join(__dirname, "npx");
      expect(fs.existsSync(npmPath)).toBe(true);
      expect(fs.existsSync(npxPath)).toBe(true);

      // Verify symlinks point to correct shim files
      expect(fs.readlinkSync(npmPath)).toBe(path.join("shims", "npm.cli.ts"));
      expect(fs.readlinkSync(npxPath)).toBe(path.join("shims", "npx.cli.ts"));

      // Check if other shim files are not created
      expect(fs.existsSync(path.join(__dirname, "yarn"))).toBe(false);
      expect(fs.existsSync(path.join(__dirname, "pnpm"))).toBe(false);
    });

    it("should create shim files for multiple specific package managers", () => {
      // Run enable-shim command for npm and pnpm
      childProcess.execSync(`node ${cliPath} enable-shim npm pnpm`, {
        encoding: "utf8",
      });

      // Check if npm, npx, pnpm, and pnpx shim files are created
      const npmPath = path.join(__dirname, "npm");
      const npxPath = path.join(__dirname, "npx");
      const pnpmPath = path.join(__dirname, "pnpm");
      const pnpxPath = path.join(__dirname, "pnpx");

      expect(fs.existsSync(npmPath)).toBe(true);
      expect(fs.existsSync(npxPath)).toBe(true);
      expect(fs.existsSync(pnpmPath)).toBe(true);
      expect(fs.existsSync(pnpxPath)).toBe(true);

      // Verify symlinks point to correct shim files
      expect(fs.readlinkSync(npmPath)).toBe(path.join("shims", "npm.cli.ts"));
      expect(fs.readlinkSync(npxPath)).toBe(path.join("shims", "npx.cli.ts"));
      expect(fs.readlinkSync(pnpmPath)).toBe(path.join("shims", "pnpm.cli.ts"));
      expect(fs.readlinkSync(pnpxPath)).toBe(path.join("shims", "pnpx.cli.ts"));

      // Check if yarn shim files are not created
      expect(fs.existsSync(path.join(__dirname, "yarn"))).toBe(false);
      expect(fs.existsSync(path.join(__dirname, "yarnpkg"))).toBe(false);
    });
  });
});
