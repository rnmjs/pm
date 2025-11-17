import ru from "registry-url";

let cache: string | undefined = undefined;
export function registryUrl() {
  cache ??= ru().replace(/\/$/, "");
  return cache;
}
