// Extract `import.meta.resolve` as a function because vitest doesn't support it.
// TODO: Remove this when https://github.com/vitest-dev/vitest/issues/6953 is solved.
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

export const importMetaResolve = (id: string) =>
  pathToFileURL(createRequire(import.meta.url).resolve(id));
