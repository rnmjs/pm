import { styleText } from "node:util";
import { run } from "../base.ts";
import { getPackageJson } from "../common.ts";
import { executorMap, type SupportedPm } from "../constants.ts";
import { detect } from "../utils/detector.ts";

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
  const runningCommand = execute ? executorMap[pm] : pm;
  const recommendedCommand = execute ? "px" : "pm";
  // eslint-disable-next-line no-console -- If we don't add console here, we need to add it to all the callers, which is tedious.
  console.warn(
    styleText(
      "dim",
      `⚠️ You are using '${runningCommand}', which is a shim created by '@rnm/pm' (v${(await getPackageJson()).version}). We recommend that you always use the '${recommendedCommand}' command directly, rather than '${runningCommand}'.`,
    ),
  );
  return await run(
    { name: pm, ...(result?.version && { version: result.version }) },
    args,
    execute,
  );
}
