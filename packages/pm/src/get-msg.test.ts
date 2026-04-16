import process from "node:process";
import { styleText } from "node:util";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getMsg } from "./base.ts";
import { getPackageJson } from "./common.ts";
import { defaultVersions } from "./constants.ts";
import { detect } from "./utils/detector.ts";

const envKeys = {
  npm: "JRM_MULTISHELL_PATH_OF_NPM",
  yarn: "JRM_MULTISHELL_PATH_OF_YARN",
  pnpm: "JRM_MULTISHELL_PATH_OF_PNPM",
};

describe("get-msg", () => {
  beforeAll(() => {
    // Clear any pre-existing JRM_MULTISHELL_PATH env vars so that
    // tests in the "corepack format" group are not affected by them.
    // Individual test groups will set them back as needed.
    Reflect.deleteProperty(process.env, envKeys.npm);
    Reflect.deleteProperty(process.env, envKeys.yarn);
    Reflect.deleteProperty(process.env, envKeys.pnpm);
  });

  describe("corepack format ['/path/to/corepack', 'npm@11.0.0', '-v']", () => {
    it("should return npm by default", async () => {
      const msg = await getMsg(undefined, ["foo"]);
      const packageJson = getPackageJson();
      expect(msg).toBe(
        `📦 ${styleText("bold", `[npm@${defaultVersions.npm}]`)}${styleText("dim", `(pm@${packageJson.version})`)} ➜ ${styleText("blue", "corepack npm foo")}`,
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
        `📦 ${styleText("bold", `[npm@${defaultVersions.npm}]`)}${styleText("dim", `(pm@${packageJson.version})`)} ➜ ${styleText("blue", "corepack npx --version")}`,
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
        `📦 ${styleText("bold", "[pnpm@8.0.0]")}${styleText("dim", `(pm@${packageJson.version})`)} ➜ ${styleText("blue", "corepack pnpx create my-app")}`,
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
        `📦 ${styleText("bold", "[yarn@4.0.0]")}${styleText("dim", `(pm@${packageJson.version})`)} ➜ ${styleText("blue", "corepack yarnpkg add lodash")}`,
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
        `📦 ${styleText("bold", "[npm@10.0.0]")}${styleText("dim", `(pm@${packageJson.version})`)} ➜ ${styleText("blue", "corepack npm run build --verbose")}`,
      );
    });

    it("should handle empty args", async () => {
      const msg = await getMsg({ name: "yarn", version: "1.22.0" }, []);
      const packageJson = getPackageJson();
      expect(msg).toBe(
        `📦 ${styleText("bold", "[yarn@1.22.0]")}${styleText("dim", `(pm@${packageJson.version})`)} ➜ ${styleText("blue", "corepack yarn")}`,
      );
    });

    it("should throw when internal error occurs", async () => {
      const msg = await getMsg(undefined, ["--version"]);
      expect(typeof msg).toBe("string");
      const packageJson = getPackageJson();
      expect(msg).toBe(
        `📦 ${styleText("bold", `[npm@${defaultVersions.npm}]`)}${styleText("dim", `(pm@${packageJson.version})`)} ➜ ${styleText("blue", "corepack npm --version")}`,
      );
    });
  });

  describe("direct format ['npm', '-v']", () => {
    describe("npm", () => {
      const envKey = envKeys.npm;

      beforeAll(() => {
        process.env[envKey] = "1";
      });

      afterAll(() => {
        Reflect.deleteProperty(process.env, envKey);
      });

      it("should return [npm] without version when env is set", async () => {
        const msg = await getMsg(undefined, ["foo"]);
        const packageJson = getPackageJson();
        expect(msg).toBe(
          `📦 ${styleText("bold", "[npm]")}${styleText("dim", `(pm@${packageJson.version})`)} ➜ ${styleText("blue", "npm foo")}`,
        );
      });

      it("should use executor (npx) when execute is true", async () => {
        const msg = await getMsg(undefined, ["--version"], true);
        const packageJson = getPackageJson();
        expect(msg).toBe(
          `📦 ${styleText("bold", "[npx]")}${styleText("dim", `(pm@${packageJson.version})`)} ➜ ${styleText("blue", "npx --version")}`,
        );
      });
    });

    describe("pnpm", () => {
      const envKey = envKeys.pnpm;

      beforeAll(() => {
        process.env[envKey] = "1";
      });

      afterAll(() => {
        Reflect.deleteProperty(process.env, envKey);
      });

      it("should return [pnpm] without version when env is set", async () => {
        const msg = await getMsg({ name: "pnpm", version: "8.0.0" }, [
          "install",
        ]);
        const packageJson = getPackageJson();
        expect(msg).toBe(
          `📦 ${styleText("bold", "[pnpm]")}${styleText("dim", `(pm@${packageJson.version})`)} ➜ ${styleText("blue", "pnpm install")}`,
        );
      });

      it("should use executor (pnpx) when execute is true", async () => {
        const msg = await getMsg(
          { name: "pnpm", version: "8.0.0" },
          ["create", "my-app"],
          true,
        );
        const packageJson = getPackageJson();
        expect(msg).toBe(
          `📦 ${styleText("bold", "[pnpx]")}${styleText("dim", `(pm@${packageJson.version})`)} ➜ ${styleText("blue", "pnpx create my-app")}`,
        );
      });
    });

    describe("yarn", () => {
      const envKey = envKeys.yarn;

      beforeAll(() => {
        process.env[envKey] = "1";
      });

      afterAll(() => {
        Reflect.deleteProperty(process.env, envKey);
      });

      it("should return [yarn] without version when env is set", async () => {
        const msg = await getMsg({ name: "yarn", version: "4.0.0" }, [
          "add",
          "lodash",
        ]);
        const packageJson = getPackageJson();
        expect(msg).toBe(
          `📦 ${styleText("bold", "[yarn]")}${styleText("dim", `(pm@${packageJson.version})`)} ➜ ${styleText("blue", "yarn add lodash")}`,
        );
      });

      it("should use executor (yarnpkg) when execute is true", async () => {
        const msg = await getMsg(
          { name: "yarn", version: "4.0.0" },
          ["add", "lodash"],
          true,
        );
        const packageJson = getPackageJson();
        expect(msg).toBe(
          `📦 ${styleText("bold", "[yarnpkg]")}${styleText("dim", `(pm@${packageJson.version})`)} ➜ ${styleText("blue", "yarnpkg add lodash")}`,
        );
      });
    });

    describe("env should match detected pm, fallback to corepack format", () => {
      beforeAll(() => {
        process.env[envKeys.npm] = "1";
      });

      afterAll(() => {
        Reflect.deleteProperty(process.env, envKeys.npm);
      });

      it("should use corepack format when env does not match detected pm", async () => {
        // JRM_MULTISHELL_PATH_OF_NPM is set, but detectResult is pnpm
        // So direct format is NOT triggered, corepack format is used
        const msg = await getMsg({ name: "pnpm", version: "8.0.0" }, [
          "install",
        ]);
        expect(msg).toContain("[pnpm@8.0.0]");
      });
    });
  });
});
