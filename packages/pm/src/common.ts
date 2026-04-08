// TODO: Use [module.findPackageJSON](https://nodejs.org/api/module.html#modulefindpackagejsonspecifier-base) when dropping support for Node.js < 22.14.0.
// eslint-disable-next-line esm/no-external-src-imports -- JSON import needed to read package.json at runtime
import packageJson from "../package.json" with { type: "json" };

export function getPackageJson() {
  return packageJson;
}
