export type SupportedPm = "npm" | "yarn" | "pnpm";

export const executorMap = {
  npm: "npx",
  yarn: "yarnpkg", // Not very correct since yarn has no similar command like `npx` and `pnpx` officially.
  pnpm: "pnpx",
} as const satisfies Record<SupportedPm, string>;

/**
 * The version will increase along with dependency corepack upgrade.
 */
export const defaultVersions = {
  npm: "11.4.1",
  yarn: "1.22.22",
  pnpm: "10.11.0",
} as const satisfies Record<SupportedPm, string>;
