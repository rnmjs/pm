import process from "node:process";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { getPackageJson } from "../common.ts";

describe("px.cli", () => {
  beforeAll(() => {
    // Clear any pre-existing JRM_MULTISHELL_PATH env vars so that
    // tests are not affected by them.
    Reflect.deleteProperty(process.env, "JRM_MULTISHELL_PATH_OF_NPM");
    Reflect.deleteProperty(process.env, "JRM_MULTISHELL_PATH_OF_YARN");
    Reflect.deleteProperty(process.env, "JRM_MULTISHELL_PATH_OF_PNPM");
  });

  const exitMock = vi
    .spyOn(process, "exit")
    .mockImplementationOnce(() => undefined as never);
  const logMock = vi.spyOn(console, "log").mockImplementationOnce(() => true);
  it("should work for `-v` option", async () => {
    process.argv.push("@rnm/pm", "-v");
    // eslint-disable-next-line esm/no-cli-imports -- for test
    await import("./px.cli.ts");
    const packageJson = getPackageJson();
    expect(exitMock).toHaveBeenCalledTimes(1);
    // expect(exitMock).toHaveBeenCalledWith(0); // TODO: Uncomment this later
    expect(logMock).toHaveBeenCalledTimes(1);
    expect(logMock).toHaveBeenCalledWith(
      `📦 [pnpm@10.28.1](pm@${packageJson.version}) ➜ pnpx @rnm/pm -v`,
    );
    process.argv.splice(-2);
  });
});
