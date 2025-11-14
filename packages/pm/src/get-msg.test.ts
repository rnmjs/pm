import { styleText } from "node:util";
import { describe, expect, it } from "vitest";
import { getMsg } from "./base.ts";
import { defaultVersions } from "./constants.ts";

describe("get-msg", () => {
  it("should get return npm by default", () => {
    const msg = getMsg(undefined, ["foo"]);
    expect(msg).toBe(
      `📦 ${styleText("bold", `[npm@${defaultVersions.npm}]`)}${styleText("dim", "(fallback)")} ➜ ${styleText("blue", "npm foo")}`,
    );
  });
});
