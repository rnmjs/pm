#!/usr/bin/env node
import process from "node:process";
// TODO: Use named import if we drop support for Node.js <= 18
// eslint-disable-next-line unicorn/import-style
import util from "node:util";
import { main } from "./main.ts";

const status = await main({
  onDetected: (result) => {
    const styleText =
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      util.styleText ?? ((_color: string, text: string) => text);
    const { name, version } = result ?? {};
    const styledVersion = version
      ? styleText("green", version)
      : styleText("red", "unknown");
    const nameVer = styleText("bold", `${name ?? "npm"}@${styledVersion}`);
    console.log(`📦 Using ${nameVer} (${name ? "detected" : "fallback"})`);
  },
});
process.exit(status);
