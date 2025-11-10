# 📦 PM

[![](https://img.shields.io/npm/l/@rnm/pm.svg)](https://github.com/rnmjs/pm/blob/main/LICENSE)
[![](https://img.shields.io/npm/v/@rnm/pm.svg)](https://www.npmjs.com/package/@rnm/pm)
[![](https://img.shields.io/npm/dm/@rnm/pm.svg)](https://www.npmjs.com/package/@rnm/pm)
[![](https://packagephobia.com/badge?p=@rnm/pm)](https://packagephobia.com/result?p=@rnm/pm)
[![](https://raw.githubusercontent.com/rnmjs/pm/refs/heads/main/packages/pm/badge/coverage.svg)]()
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/rnmjs/pm?tab=readme-ov-file#contributing)

A unified package manager for Node.js that supports `npm`, `yarn`, and `pnpm`. This human-friendly Corepack wrapper lets you forget about `npm`, `yarn`, and `pnpm` — just use the `pm` command for everything.

## Highlights

- **📦 All-in-One**: Supports npm, yarn, and pnpm without extra installations.
- **🎯 Auto Detect**: Automatically detects the correct package manager.
- **⬇️ Auto Fallback**: Automatically falls back to npm if no package manager is detected.
- **🔀 Version Management**: Automatically switches to the proper version of the detected package manager.
- **⚡️ Zero Configuration**: No configuration required. Just install globally and start using it.
- **🌍 Global Safety**: Does not modify or override existing global package managers.
- **🪶 Lightweight**: Tiny codebase (< 300 lines).

## Installation

```bash
npm install -g @rnm/pm
```

## Usage

### Inside Projects

When inside a project directory, `pm` and `px` are aliases for `npm`/`yarn`/`pnpm` and `npx`/`yarnpkg`/`pnpx` respectively. The choice depends on the project's configuration. Falls back to `npm` and `npx` if no specific package manager is detected.

**Configure `packageManager` or `devEngines.packageManager` in `package.json`:**

```json
{
  "packageManager": "pnpm@10.0.0",
  "devEngines": {
    "packageManager": {
      "name": "pnpm",
      "version": "10.0.0"
    }
  }
}
```

**Commands work exactly like the underlying package manager:**

```bash
# pm = smart alias for npm/yarn/pnpm
pm install    # → npm/yarn/pnpm install
pm run build  # → npm/yarn/pnpm run build
pm --help     # → npm/yarn/pnpm --help
pm --version  # → npm/yarn/pnpm --version

# px = smart alias for npx/yarnpkg/pnpx
px create-react-app my-app --template typescript  # → npx/yarnpkg/pnpx create-react-app my-app --template typescript
px tsx --watch src/index.ts                       # → npx/yarnpkg/pnpx tsx --watch src/index.ts
```

### Outside Projects

When outside project directories, `pm` and `px` are aliases for `npm` and `npx`. These are typically used for global operations.

```bash
# pm = alias for npm
pm install -g typescript@latest  # → npm install -g typescript@latest
pm list -g --depth=0             # → npm list -g --depth=0

# px = alias for npx
px create-react-app my-app --template next  # → npx create-react-app my-app --template next
px degit user/repo my-app                   # → npx degit user/repo my-app
```

## Advanced Usage

The `pm-cli` command provides additional utilities for advanced use cases.

#### Enable Shim Commands

Use `pm-cli enable-shim` to create symbolic links that replace the native package manager commands with `@rnm/pm` equivalents:

```bash
# Enable shims for all package managers (npm, yarn, pnpm, npx, yarnpkg, pnpx)
pm-cli enable-shim

# Enable shims for specific package managers only
pm-cli enable-shim npm yarn
pm-cli enable-shim pnpm
```

This command creates symbolic links in your global installation directory, so when you run `npm`, `yarn`, or `pnpm`, they will automatically use the `@rnm/pm` detection logic.

**⚠️ Warning**: This will override your existing global package manager commands. Use with caution and ensure you understand the implications.

## Differences from Corepack

1. `@rnm/pm` detects `packageManager`, `devEngines`, and `engines` fields in `package.json` to use the correct package manager, while `corepack` only supports `packageManager` and `devEngines` fields.
2. `@rnm/pm` detects lock files (`package-lock.json`, `yarn.lock`, or `pnpm-lock.yaml`) and uses the corresponding package manager, while `corepack` does not.
3. `@rnm/pm` ignores environment variables starting with the `COREPACK_` prefix, making it non-configurable, while `corepack` respects these variables.
4. `@rnm/pm` ignores the `.corepack.env` file, while `corepack` consults it.
5. `@rnm/pm` automatically uses the result of `$(npm config get registry)` as its registry to install packages, while `corepack` uses the environment variable `COREPACK_NPM_REGISTRY` as its registry.
6. `@rnm/pm` does not provide transparency features, while `corepack` does. See [config.json](https://github.com/nodejs/corepack/blob/main/config.json) of `corepack`.

## Migration from Corepack

1. (Optional) If Corepack has enabled npm, disable it by running `npm i npm -g` to restore the default behavior.
2. Run `corepack disable yarn pnpm` to disable Corepack.
3. Install `@rnm/pm` globally.
4. Replace `npm`, `yarn`, and `pnpm` with `pm` in your projects.

## Show your support

Give a ⭐️ if this project helped you!

## License

MIT
