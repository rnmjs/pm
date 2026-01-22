---
"@rnm/pm": minor
---

refactor!: rename command `pm-cli` to `pm-util`

**Breaking Change**: The `pm-cli` command has been renamed to `pm-util`.

If you're using `pm-cli` in your scripts, replace it with `pm-util`:

```bash
# Before
pm-cli enable-shim

# After
pm-util enable-shim
```

The functionality remains the same - only the command name has changed.
