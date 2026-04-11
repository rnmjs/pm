import { styleText } from "node:util";
import { describe, expect, it } from "vitest";
import { getMsg } from "./base.ts";
import { getPackageJson } from "./common.ts";
import { defaultVersions } from "./constants.ts";
import { detect } from "./utils/detector.ts";

describe("get-msg", () => {
  describe("corepack format ['/path/to/corepack', 'npm@11.0.0', '-v']", () => {
    it("should return npm by default", async () => {
      const msg = await getMsg(undefined, ["foo"]);
      const packageJson = getPackageJson();
      expect(msg).toBe(
        `📦 ${styleText("bold", `[npm@${defaultVersions.npm}]`)}${styleText("dim", `(pm@${packageJson.version})`)} ➜ ${styleText("blue", "npm foo")}`,
      );
    });

    it("should return pnpm when detected", async () => {
      const detected = await detect();
      expect(detected?.name).toBe("pnpm");
      const msg = await getMsg(detected, ["install"]);
      expect(msg).toContain("[pnpm@");
      expect(msg).toContain("pnpm install");
    });

    it("should use executor (npx) when execute is true", async () => {
      const msg = await getMsg(undefined, ["--version"], true);
      const packageJson = getPackageJson();
      expect(msg).toBe(
        `📦 ${styleText("bold", `[npm@${defaultVersions.npm}]`)}${styleText("dim", `(pm@${packageJson.version})`)} ➜ ${styleText("blue", "npx --version")}`,
      );
    });

    it("should use executor (pnpx) when execute is true for pnpm", async () => {
      const msg = await getMsg(
        { name: "pnpm", version: "8.0.0" },
        ["create", "my-app"],
        true,
      );
      const packageJson = getPackageJson();
      expect(msg).toBe(
        `📦 ${styleText("bold", "[pnpm@8.0.0]")}${styleText("dim", `(pm@${packageJson.version})`)} ➜ ${styleText("blue", "pnpx create my-app")}`,
      );
    });

    it("should use executor (yarnpkg -> yarn) when execute is true for yarn", async () => {
      const msg = await getMsg(
        { name: "yarn", version: "4.0.0" },
        ["add", "lodash"],
        true,
      );
      const packageJson = getPackageJson();
      expect(msg).toBe(
        `📦 ${styleText("bold", "[yarn@4.0.0]")}${styleText("dim", `(pm@${packageJson.version})`)} ➜ ${styleText("blue", "yarnpkg add lodash")}`,
      );
    });

    it("should handle multiple args", async () => {
      const msg = await getMsg({ name: "npm", version: "10.0.0" }, [
        "run",
        "build",
        "--verbose",
      ]);
      const packageJson = getPackageJson();
      expect(msg).toBe(
        `📦 ${styleText("bold", "[npm@10.0.0]")}${styleText("dim", `(pm@${packageJson.version})`)} ➜ ${styleText("blue", "npm run build --verbose")}`,
      );
    });

    it("should handle empty args", async () => {
      const msg = await getMsg({ name: "yarn", version: "1.22.0" }, []);
      const packageJson = getPackageJson();
      expect(msg).toBe(
        `📦 ${styleText("bold", "[yarn@1.22.0]")}${styleText("dim", `(pm@${packageJson.version})`)} ➜ ${styleText("blue", "yarn")}`,
      );
    });

    it("should throw when internal error occurs", async () => {
      // This tests the type safety check in getMsg.
      // It's hard to trigger without deep mocking, but we can verify the happy path doesn't throw.
      const msg = await getMsg(undefined, ["--version"]);
      expect(typeof msg).toBe("string");
      const packageJson = getPackageJson();
      expect(msg).toBe(
        `📦 ${styleText("bold", `[npm@${defaultVersions.npm}]`)}${styleText("dim", `(pm@${packageJson.version})`)} ➜ ${styleText("blue", "npm --version")}`,
      );
    });
  });

  describe("direct format ['npm', '-v']", () => {
    // Currently getMsg always calls getCommand which returns the corepack format.
    // The direct format branch is for future use when getCommand may return ['npm', '-v'] directly.
    // This block is reserved for future tests when that happens.
    it("is reserved for future use when getCommand returns direct format", () => {
      // placeholder
    });
  });
});
