#!/usr/bin/env node
// This command is used to improve compatibility.
// It is generally not recommended to use this command.
import { main } from "./main.ts";

await main({ forceTo: "yarn" });
