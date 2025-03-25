#!/usr/bin/env node
import { main } from "./main.ts";

await main({
  onDetected: (pm) => {
    if (!pm) {
      console.log("No package manager detected then fall back to npm");
    } else {
      console.log(`Detected ${pm} as package manager`);
    }
  },
});
