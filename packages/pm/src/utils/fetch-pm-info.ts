import type { SupportedPm } from "../constants.ts";
import { registryUrl } from "./registry-url.ts";

const cache = new Map<SupportedPm, { versions: unknown }>();
export async function fetchPmInfo(
  pm: SupportedPm,
): Promise<{ versions: unknown }> {
  const cachedInfo = cache.get(pm);
  if (cachedInfo) return cachedInfo;

  const result = await fetch(`${registryUrl()}/${pm}`).then(
    async (resp) => await resp.json(),
  );
  if (
    typeof result !== "object" ||
    result === null ||
    !("versions" in result)
  ) {
    throw new Error(`Failed to fetch ${pm} info from ${registryUrl()}/${pm}.`);
  }

  cache.set(pm, result);
  return result;
}
