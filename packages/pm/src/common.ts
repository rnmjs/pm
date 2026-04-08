// eslint-disable-next-line esm/no-external-src-imports -- JSON import needed to read package.json at runtime
import packageJson from "../package.json" with { type: "json" };

export function getPackageJson() {
  return packageJson;
}
