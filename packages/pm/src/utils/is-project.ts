import process from "node:process";
import { findUp } from "find-up-simple";

/**
 * Checks if the specified directory is within a project (has a package.json).
 * @param directory - The absolute path to the directory to check. Defaults to current working directory.
 * @returns A promise that resolves to true if a package.json is found, false otherwise.
 */
export async function isProject(directory = process.cwd()): Promise<boolean> {
  return !!(await findUp("package.json", { cwd: directory }));
}
