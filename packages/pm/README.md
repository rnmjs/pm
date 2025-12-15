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
- **⚡️ Zero Configuration**: No configuration required. Just install it globally and start using it.
- **🌍 Global Safety**: Does not modify or override existing global package managers by default.
- **🪶 Lightweight**: Tiny codebase (~ 400 lines).

## Installation

```bash
npm install -g @rnm/pm
```

## Usage

### Inside Projects

When inside a project directory, `pm` and `px` are aliases for `npm`/`yarn`/`pnpm` and `npx`/`yarnpkg`/`pnpx` respectively. The choice depends on the project's configuration. Falls back to `npm` and `npx` if no specific package manager is detected.

Configure `packageManager` or `devEngines.packageManager` in `package.json`:

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

Commands work exactly like the underlying package manager:

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

1. **Field Detection**: `@rnm/pm` detects `packageManager`, `devEngines`, and `engines` fields in `package.json`, while Corepack only supports `packageManager` and `devEngines`.
2. **Lock File Detection**: `@rnm/pm` automatically detects lock files (`package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`) to determine the package manager, while Corepack does not.
3. **Version Range Support**: `@rnm/pm` supports version ranges (e.g., `^10.0.0`) in `packageManager` and `devEngines.packageManager.version` fields, while Corepack only accepts specific versions.
4. **Environment Variables**: `@rnm/pm` ignores `COREPACK_*` environment variables for non-configurable behavior, while Corepack respects them.
5. **Configuration Files**: `@rnm/pm` ignores `.corepack.env` files, while Corepack reads them for configuration.
6. **Registry Configuration**: `@rnm/pm` uses `npm config get registry` for package installation, while Corepack uses the `COREPACK_NPM_REGISTRY` environment variable.
7. **Transparency Features**: `@rnm/pm` does not provide transparency features, unlike Corepack. See Corepack's [config.json](https://github.com/nodejs/corepack/blob/main/config.json) for details.

## Migration from Corepack

1. Install `@rnm/pm` globally using `npm install -g @rnm/pm`.
2. Replace `npm`, `yarn`, and `pnpm` with `pm` in your projects.

## Show your support

Give a ⭐️ if this project helped you!

## License

MIT
