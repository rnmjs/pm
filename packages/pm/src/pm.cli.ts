#!/usr/bin/env node
import process from "node:process";
import { detect, getMsg, run } from "./base.ts";

const result = await detect();
const args = process.argv.slice(2);
const msg = getMsg(result, args);
console.log(msg);
process.exit(await run(result, args));
