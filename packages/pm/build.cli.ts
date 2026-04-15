#!/usr/bin/env node
import { build } from "esbuild";
import pkgJson from "./package.json" with { type: "json" };

await build({
  entryPoints: ["src/bin/*.cli.ts", "src/shims/*.cli.ts"],
  bundle: true,
  platform: "node",
  target: "esnext",
  format: "esm",
  outdir: "dist",
  splitting: true,
  outbase: "src",
  external: Object.keys(pkgJson.dependencies),
  minify: true,
  banner: {
    js: "const require = globalThis.require ?? (await import('node:module')).createRequire(import.meta.url);",
  },
});
