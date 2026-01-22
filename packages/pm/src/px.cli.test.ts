import process from "node:process";
import { describe, expect, it, vi } from "vitest";

describe("px.cli", () => {
  const exitMock = vi
    .spyOn(process, "exit")
    .mockImplementationOnce(() => undefined as never);
  const logMock = vi.spyOn(console, "log").mockImplementationOnce(() => true);
  it("should work for `-v` option", async () => {
    process.argv.push("@rnm/pm", "-v");
    // eslint-disable-next-line esm/no-cli-imports -- for test
    await import("./px.cli.ts");
    expect(exitMock).toBeCalledTimes(1);
    expect(exitMock).toBeCalledWith(0);
    expect(logMock).toBeCalledTimes(1);
    expect(logMock).toBeCalledWith(
      "📦 [pnpm@10.28.1](detected) ➜ pnpx @rnm/pm -v",
    );
    process.argv.splice(-2);
  });
});
