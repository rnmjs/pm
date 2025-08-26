import chalk from "chalk";
import { describe, expect, it } from "vitest";
import { getMsg } from "./base.ts";
import { defaultVersions } from "./constants.ts";

describe("get-msg", () => {
  it("should get return npm by default", () => {
    const msg = getMsg(undefined, ["foo"]);
    expect(msg).toBe(
      `📦 ${chalk.bold(`[npm@${defaultVersions.npm}]`)}${chalk.dim("(fallback)")} ➜ ${chalk.blue("npm foo")}`,
    );
  });
});
