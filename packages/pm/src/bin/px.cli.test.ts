import process from "node:process";
import { describe, expect, it, vi } from "vitest";
import { getPackageJson } from "../common.ts";

describe("px.cli", () => {
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
    expect(exitMock).toHaveBeenCalledWith(0);
    expect(logMock).toHaveBeenCalledTimes(1);
    expect(logMock).toHaveBeenCalledWith(
      `📦 [pnpm@10.28.1](pm@${packageJson.version}) ➜ pnpx @rnm/pm -v`,
    );
    process.argv.splice(-2);
  });
});
