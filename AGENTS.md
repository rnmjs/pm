## Project Overview

`@rnm/pm` is a unified package manager for Node.js — a smart wrapper around `npm`, `yarn`, and `pnpm` powered by Corepack. It auto-detects the correct package manager from `package.json` fields (`devEngines.packageManager` > `packageManager` > `engines`) or lock files, and falls back to npm when none is detected.

## Monorepo Structure

This is a pnpm workspace monorepo. The only package is `packages/pm/`.

### Root package.json

@package.json

### Common Scripts

Read the root package.json for common scripts.

### Directory Structure

```
packages/pm/
  src/
    bin/
      pm.cli.ts      # Main `pm` command entry point
      px.cli.ts      # `px` command entry point (for npx/yarnpkg/pnpx)
      pm-util.cli.ts # Utility commands (enable-shim, etc.)
    shims/
      npm.cli.ts     # Shim entry points for individual package managers
      npx.cli.ts
      pnpm.cli.ts
      pnpx.cli.ts
      yarn.cli.ts
      yarnpkg.cli.ts
      execute-shim.ts
    base.ts          # Core execution logic
    common.ts        # Shared utilities
    constants.ts     # Supported package managers and defaults
    utils/           # Helper functions (detector, version fetching, registry, corepack home, etc.)
```

## Architecture

- **Entry points**: `src/bin/pm.cli.ts`, `src/bin/px.cli.ts`, `src/bin/pm-util.cli.ts` — compiled to `dist/bin/*.cli.js`
- **Detection**: The detector (`utils/detector.ts`) prioritizes `devEngines.packageManager` > `packageManager` > `engines` field > lock file detection. Version ranges (e.g. `^10.0.0`) are supported via semver.
- **Execution**: `base.ts` uses Corepack to execute the resolved package manager command.
- **Outside projects**: Falls back to `npm`/`npx` when no project config is found.
- **Shims**: `pm-util enable-shim` creates symlinks to override native package manager commands. Shims live in `src/shims/`.

## Important Notes

- Uses `fenge` for linting and `esbuild` for building.
- TypeScript config extends `fenge/tsconfig` and `fenge/tsconfig/node`.
- Tests use `vitest`.
