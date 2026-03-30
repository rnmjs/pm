#!/usr/bin/env node
import { getCorepackPath } from "./base.ts";

// eslint-disable-next-line esm/no-dynamic-imports -- Temporary.
await import(getCorepackPath());
