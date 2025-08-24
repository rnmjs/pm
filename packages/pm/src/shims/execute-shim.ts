import { detect, run, type SupportedPm } from "../base.ts";

export async function executeShim(
  pm: SupportedPm,
  args: string[],
  execute?: boolean,
) {
  // Corepack has transparent configs: https://github.com/nodejs/corepack/blob/main/config.json.
  // That means we can use npx/pnpx in any project, which is confused. So we disallow it.
  const result = await detect();
  if (result && result.name !== pm) {
    throw new Error(
      `Current project should use ${result.name} as package manager.`,
    );
  }
  return await run(
    { name: pm, ...(result?.version && { version: result.version }) },
    args,
    execute,
  );
}
