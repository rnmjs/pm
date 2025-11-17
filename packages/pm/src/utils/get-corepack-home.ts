import os from "node:os";
import path from "node:path";
import process from "node:process";

export function getCorepackHome() {
  // Copied from https://github.com/nodejs/corepack/blob/fae35276605ff6c28b7a5eef4eb41a8bd8b3f2c6/sources/folderUtils.ts#L14
  return path.join(
    process.env["XDG_CACHE_HOME"] ??
      process.env["LOCALAPPDATA"] ??
      path.join(
        os.homedir(),
        process.platform === "win32" ? "AppData/Local" : ".cache",
      ),
    "node/corepack/v1",
  );
}
