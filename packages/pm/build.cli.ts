#!/usr/bin/env node
import { build } from "esbuild";
import pkgJson from "./package.json" with { type: "json" };

await build({
  entryPoints: Object.values(pkgJson.bin).map((entry) =>
    entry.replace(/^\.\/dist\/(.+)\.js$/, "src/$1.ts"),
  ),
  bundle: true,
  platform: "node",
  target: "esnext",
  format: "esm",
  outdir: "dist",
  splitting: true,
  outbase: "src",
  external: Object.keys(pkgJson.dependencies),
  minify: true,
});
