// @ts-check
import { Builder } from "fenge/eslint-config";

export default new Builder()
  .enableAll()
  .append({
    rules: {
      "pkg-json/compatible-engines-node-version": "off",
    },
  })
  .toConfig();
