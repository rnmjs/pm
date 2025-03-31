// Extract `import.meta.resolve` as a function because vitest doesn't support it.
// TODO: Remove this when https://github.com/vitest-dev/vitest/issues/6953 is solved.
export const importMetaResolve: ImportMeta["resolve"] = (specifier, parent) =>
  import.meta.resolve(specifier, parent);
