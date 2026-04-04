// @ts-check
import { Builder } from "fenge/eslint-config";

export default new Builder()
  .enableAll()
  .append({
    files: ["packages/pm/src/bin/*.cli.ts", "packages/pm/src/shims/*.cli.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "^(?!\\.{1,2}/|node:)",
              message:
                "Only relative imports and node: built-in imports are allowed in CLI entry files.",
            },
            {
              regex: "^(?!\\.\\./index\\.ts$)\\.",
              message:
                "Only '../index.ts' relative imports are allowed in CLI entry files.",
            },
          ],
        },
      ],
    },
  })
  .append({
    files: ["**/*.{js,ts}"],
    rules: {
      "esm/no-phantom-dep-imports": ["error", { allowDevDependencies: true }],
    },
  })
  .toConfig();
