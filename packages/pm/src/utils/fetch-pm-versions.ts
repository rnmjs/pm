import type { SupportedPm } from "../constants.ts";
import { registryUrl } from "./registry-url.ts";

const isObject = (value: unknown) =>
  typeof value === "object" && value !== null;

async function runFetch(pkg: string) {
  const json = await fetch(`${registryUrl()}/${pkg}`).then(
    async (resp) => await resp.json(),
  );
  if (!isObject(json) || !("versions" in json) || !isObject(json.versions)) {
    throw new Error(
      `Failed to fetch ${pkg} info from ${registryUrl()}/${pkg}.`,
    );
  }
  return Object.keys(json.versions);
}

const cache = new Map<SupportedPm, string[]>();
export async function fetchPmVersions(pm: SupportedPm): Promise<string[]> {
  const cached = cache.get(pm);
  if (cached) return cached;
  const versions = [
    ...(await runFetch(pm)),
    ...(pm === "yarn" ? await runFetch("@yarnpkg/cli") : []),
  ];
  cache.set(pm, versions);
  return versions;
}
