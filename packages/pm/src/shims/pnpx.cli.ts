#!/usr/bin/env node
import process from "node:process";
import { run } from "../base.ts";

process.exit(await run({ name: "pnpm" }, process.argv.slice(2), true));
