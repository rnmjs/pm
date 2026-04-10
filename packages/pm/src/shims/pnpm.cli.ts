#!/usr/bin/env node
import process from "node:process";
import { executeShim } from "../index.ts";

process.exit(
  await executeShim("pnpm", process.argv.slice(2)).catch((e: unknown) => {
    console.error(e);
    return 1;
  }),
);
