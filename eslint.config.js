// @ts-check
import { Builder } from "fenge/eslint-config";

export default new Builder()
  .enablePackageJson({
    omit: ["publint/warning", "publint/error"],
  })
  .enableJavaScript()
  .enableTypeScript()
  .toConfig();
