#!/usr/bin/env node
// This command is used to improve compatibility.
// It is generally not recommended to use this command.
import process from "node:process";
import { run } from "./base.ts";

process.exit(await run({ name: "yarn" }, process.argv.slice(2)));
