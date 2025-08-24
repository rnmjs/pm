import process from "node:process";
import { describe, expect, it, vi } from "vitest";

describe("pm.cli", () => {
  const exitMock = vi
    .spyOn(process, "exit")
    .mockImplementationOnce(() => undefined as never);
  const logMock = vi.spyOn(console, "log").mockImplementationOnce(() => true);
  it("should work for `-v` option", async () => {
    process.argv.push("-v");
    await import("./pm.cli.ts");
    expect(exitMock).toBeCalledTimes(1);
    expect(exitMock).toBeCalledWith(0);
    expect(logMock).toBeCalledTimes(1);
    expect(logMock).toBeCalledWith("📦 [pnpm@10.10.0](detected) ➜ pnpm -v");
    process.argv.pop();
  });
});
