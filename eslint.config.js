// @ts-check
import { Builder } from "fenge/eslint-config";

export default new Builder()
  .enableJavaScript()
  .enableTypeScript()
  .enablePackageJson()
  .append({
    rules: {
      "pkg-json/compatible-engines-node-version": "off",
    },
  })
  .toConfig();
