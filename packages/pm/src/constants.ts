export type SupportedPm = "npm" | "yarn" | "pnpm";

export const executorMap = {
  npm: "npx",
  yarn: "yarnpkg", // Not very correct since yarn has no similar command like `npx` and `pnpx` officially.
  pnpm: "pnpx",
} as const satisfies Record<SupportedPm, string>;
