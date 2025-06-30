import process from "node:process";
import { detect, run, type DetectResult, type SupportedPm } from "./base.ts";

export async function main({
  forceTo,
  onDetected,
}: {
  forceTo?: SupportedPm;
  onDetected?: (pm: DetectResult | undefined) => void;
}): Promise<number> {
  const args = process.argv.slice(2);
  if (forceTo) {
    return await run({ name: forceTo }, args);
  }
  const detectResult = await detect();
  onDetected?.(detectResult);
  return await run(detectResult ?? { name: "npm" }, args);
}
