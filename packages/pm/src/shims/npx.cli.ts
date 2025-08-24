#!/usr/bin/env node
import process from "node:process";
import { executeShim } from "./execute-shim.ts";

process.exit(await executeShim("npm", process.argv.slice(2), true));
