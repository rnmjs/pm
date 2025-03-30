# 💼 PM

[![](https://img.shields.io/npm/l/@rnm/pm.svg)](https://github.com/rnmjs/pm/blob/main/LICENSE)
[![](https://img.shields.io/npm/v/@rnm/pm.svg)](https://www.npmjs.com/package/@rnm/pm)
[![](https://img.shields.io/npm/dm/@rnm/pm.svg)](https://www.npmjs.com/package/@rnm/pm)
[![](https://packagephobia.com/badge?p=@rnm/pm)](https://packagephobia.com/result?p=@rnm/pm)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/rnmjs/pm?tab=readme-ov-file#contributing)

💼 Unified Package Manager for Node.js (npm, yarn, pnpm)

## Why PM

<details>
<summary>English</summary>

Regarding the usage scenarios of package managers like npm, yarn, and pnpm, we can divide them into two categories:

- **Global Scope**: When installing global CLI tools, such as `tsx`, `pm2`, `serve`, etc., it is recommended to use **npm** for installation.
- **Project Scope**: During project development, it is recommended to use the package manager and version required by the project.

The former is easy to achieve because npm is already installed on your system by default with Node.js. You just need to run `npm i -g <package>` to globally install the CLI tool you want.

However, there has never been a good solution for the latter. When developing multiple projects, developers often need to manually switch between package managers and their versions across projects. If the wrong package manager or version is chosen, it can often lead to bugs or even prevent the project from running, which is a mental burden on developers. Corepack is one solution, but it is still not perfect, as it does not automatically enable npm and still requires attention to which package manager the project uses, without automatic detection.

To solve the problem of automatically switching package managers during project development, `@rnm/pm` was created. It allows you to automatically, seamlessly, and with zero configuration use the correct package manager and its version.

In summary: **Use npm for installing global CLI tools, and use `@rnm/pm` for daily project development!**

</details>

<details>
<summary>简体中文</summary>

关于 npm、yarn、pnpm 等包管理器的使用场景，我们可以分为 2 种情况：

- **全局维度**：安装全局 CLI 工具时，例如 `tsx`、`pm2`、`serve` 等，推荐使用 **npm** 来安装它们。
- **项目维度**：开发项目时，则推荐使用项目要求的包管理器和要求的版本来开发。

前者很容易做到，因为 npm 已经默认随着 Node.js 安装在你的系统中，你只需要 `npm i -g <package>` 即可全局安装你想要的 CLI 工具。

然而后者一直没有很好的解决方案，在开发多个项目时，开发者经常需要在项目间反复手动切换包管理器以及包管理器的版本。一旦包管理器和版本选择不对，往往会给项目带来 Bug，甚至运行不起来，这对开发者来说是一个心智负担。Corepack 是解决方案之一，但仍然不够完美，一来不自动启用 npm，二来仍然需要关注项目使用的是哪个包管理，不能自动检测。

为了解决项目开发时手动切换包管理器的痛点，`@rnm/pm` 应运而生。它能让你自动、无缝、零配置地使用正确的包管理器及其版本。

总之，我们推荐：

- **全局 CLI 工具**：继续使用 npm 安装。
- **项目开发**：统一使用 `@rnm/pm`，而非 npm、yarn、pnpm，以享受自动化的便利。

</details>

## Highlights

- **📦 All-in-One**: Supports npm, yarn, and pnpm without extra installations.
- **🎯 Auto Detect**: Auto detects the correct package manager.
- **⬇️ Auto Fallback**: Auto fallbacks to npm if no package manager is detected.
- **🔀 Version Management**: Auto switches to the proper version of the detected package manager.
- **⚡️ Zero Configuration**: No configuration required. Just install globally and start using it.
- **🌍 Global Safety**: Does not modify or override existing global package managers.
- **🪶 Lightweight**: Tiny codebase (<200 lines).

## Installation

```bash
npm install -g @rnm/pm
```

## Usage

`pm` detects the appropriate package manager via the [packageManager](https://nodejs.org/api/packages.html#packagemanager) and [devEngines.packageManager](https://docs.npmjs.com/cli/v11/configuring-npm/package-json#devengines) fields in the nearest `package.json`. If these fields are absent, `pm` looks for the nearest lock file (`package-lock.json`, `yarn.lock`, or `pnpm-lock.yaml`) and uses the corresponding package manager. If no package manager is detected, `pm` falls back to npm.

Calling `pm` is equivalent to calling the detected package manager. Any arguments passed to `pm` will be forwarded to the detected package manager.

```bash
pm --help

# npm --help
# yarn --help
# pnpm --help
```

```bash
pm install

# npm install
# yarn install
# pnpm install
```

```bash
pm run dev

# npm run dev
# yarn run dev
# pnpm run dev
```

> Note: Always use `@rnm/pm` within a project that contains a `package.json`. Running `pm` outside a project will fail.

## Migration from Corepack

1. (Optional) If Corepack has enabled npm, disable it by running `npm i npm -g` to restore the default behavior.
2. (Optional) Remove [Corepack environment variables](https://github.com/nodejs/corepack?tab=readme-ov-file#environment-variables) in `~/.zshrc` or `~/.bashrc`.
3. Run `corepack disable yarn pnpm` to disable Corepack.
4. Install `@rnm/pm` globally.
5. Replace `npm`, `yarn`, and `pnpm` with `pm` in your projects.

## Show your support

Give a ⭐️ if this project helped you!

## License

MIT
