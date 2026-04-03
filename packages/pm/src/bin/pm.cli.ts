#!/usr/bin/env node
import process from "node:process";
import { detect, getMsg, isProject, run } from "../index.ts";

const result = await detect();
if (!result && (await isProject(process.cwd()))) {
  console.error(
    "Cannot detect package manager for this project. Please specified a package manager. Refer to https://github.com/rnmjs/pm.",
  );
  process.exit(1);
}
const args = process.argv.slice(2);
const msg = await getMsg(result, args);
console.log(msg);
process.exit(await run(result, args));
