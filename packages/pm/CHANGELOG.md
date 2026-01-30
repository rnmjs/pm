# @rnm/pm

## 0.6.1

### Patch Changes

- 2c2d58d: feat: disallow falling back to npm for projects without specified package manager

## 0.6.0

### Minor Changes

- c1132eb: refactor!: rename command `pm-cli` to `pm-util`

  **Breaking Change**: The `pm-cli` command has been renamed to `pm-util`.

  If you're using `pm-cli` in your scripts, replace it with `pm-util`:

  ```bash
  # Before
  pm-cli enable-shim

  # After
  pm-util enable-shim
  ```

  The functionality remains the same - only the command name has changed.

### Patch Changes

- 1aec417: chore: upgrade corepack

## 0.5.4

### Patch Changes

- 351f92f: chore: add version info when calling npm/yarn/pnpm

## 0.5.3

### Patch Changes

- 5e21fe5: chore: upgrade deps

## 0.5.2

### Patch Changes

- 1353cd9: fix: fix incorrect version warning when calling `pm-cli check-pm`

## 0.5.1

### Patch Changes

- 4170983: fix: fix file not found error for corepack home

## 0.5.0

### Minor Changes

- 292bc5c: refactor: require Node.js >= 20.12

### Patch Changes

- 79b530b: feat: support range version

## 0.4.3

### Patch Changes

- 4f980bd: fix: avoid potential node version problem

## 0.4.2

### Patch Changes

- 33a199a: chore: add warn

## 0.4.1

### Patch Changes

- a85e5a1: feat: support `--version` option for `pm-cli`

## 0.4.0

### Minor Changes

- 71b8758: refactor!: remove `enable-pm-shim` command and implement `pm-cli` command

  Run `pm-cli enable-shim` instead of `enable-pm-shim`.
  Run `pm-cli enable-shim pnpm yarn` instead of `enable-pm-shim pnpm yarn`.

### Patch Changes

- 68e12fc: feat: add `pm-cli check-pm` command to validate package manager consistency

  This new command `pm-cli check-pm` allows you to verify that the currently executing package manager matches the one detected in your project. Add `"preinstall": "pm-cli check-pm"` to your package.json scripts to automatically validate package manager consistency before installation.

## 0.3.1

### Patch Changes

- eb9342b: feat: always use an exact version

  If the version of the package manager is not detected, `pm` uses a default version as a fallback.

## 0.3.0

### Minor Changes

- b56dbae: feat: remove the default built-in `yarn` and `pnpm` command and support `enable-pm-shims` command

  After globally installing `@rnm/pm` by running `npm i -g @rnm/pm`, you can run `enable-pm-shims yarn pnpm` to enable the shims for `yarn` and `pnpm`.

- c50021b: feat: change `px`

  Now, running `px foo bar` is equivalent to `npx foo bar`, `yarnpkg foo bar`, or `pnpx foo bar`

## 0.2.5

### Patch Changes

- a310a41: chore: upgrade deps

## 0.2.4

### Patch Changes

- 342ccc4: feat: optimize the printing message
- 3226646: feat: allow running `pm` outside of a project
- 4e0f6a9: feat: add `px` command

## 0.2.3

### Patch Changes

- 09cbb1f: chore: 💼 to 📦

## 0.2.2

### Patch Changes

- b18bacc: chore: upgrade corepack

## 0.2.1

### Patch Changes

- bd9ed4a: feat: pass version to corepack command

## 0.2.0

### Minor Changes

- cdebcff: feat: ignore `COREPACK_*` env variables and does not read `.corepack.env` files

## 0.1.5

### Patch Changes

- eaf25a1: chore: upgrade deps
- 30ca599: fix: should not be killed if child process is still running

## 0.1.4

### Patch Changes

- dd0bfab: chore: upgrade deps

## 0.1.3

### Patch Changes

- 19f0d26: fix: align the corepack behavior when detecting `devEngines` field

## 0.1.2

### Patch Changes

- 078e311: fix: detect by package.json first instead of lock files

## 0.1.1

### Patch Changes

- 263dfcb: fix: will exit with non-zero status when cli crash

## 0.1.0

### Minor Changes

- a595ec3: chore: docs readme

## 0.0.6

### Patch Changes

- 571d6f3: feat: print detected version

## 0.0.5

### Patch Changes

- 91d2171: feat: support `packageManager` field
- ba36f7b: fix: force to use pnpm or yarn when calling them

## 0.0.4

### Patch Changes

- 9ccb1f2: feat: add `pnpm` and `yarn` to bin

## 0.0.3

### Patch Changes

- 7e399c0: fix: fix `hasPackageJson`

## 0.0.2

### Patch Changes

- 2e8f9ff: feat: disallow using pm in the projects have no package.json
- a385a4b: fix: enhance detection

## 0.0.1

### Patch Changes

- 41a7c51: feat: finish 0.0.1
