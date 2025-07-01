#!/usr/bin/env node
import process from "node:process";
import { detect, getMsg, run } from "./base.ts";

const result = await detect();
const args = [
  ...(result?.name === "pnpm" || result?.name === "yarn"
    ? ["dlx"]
    : ["exec", "--"]),
  ...process.argv.slice(2),
];
const msg = getMsg(result, args);
console.log(msg);
await run(result, args);
