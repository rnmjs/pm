---
"@rnm/pm": patch
---

feat: add `pm-cli check-pm` command to validate package manager consistency

This new command `pm-cli check-pm` allows you to verify that the currently executing package manager matches the one detected in your project. Add `"preinstall": "pm-cli check-pm"` to your package.json scripts to automatically validate package manager consistency before installation.
