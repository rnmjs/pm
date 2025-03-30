#!/usr/bin/env node
// This command is used to improve compatibility.
// It is generally not recommended to use this command.
import process from "node:process";
import { main } from "./main.ts";

process.exit(await main({ forceTo: "yarn" }));
