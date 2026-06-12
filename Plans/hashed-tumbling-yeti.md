# Plan: Fix Obsidian Plugin Scanner Issues

## Context
Obsidian's plugin scanner reported 1 error, multiple warnings, and recommendations across 5 files. These must be fixed before the plugin can be submitted to the community plugin directory.

---

## Fixes by File

### manifest.json
- Add period to end of `description` field (line 6)

### esbuild.config.mjs + package.json
- Replace `import builtins from "builtin-modules"` with `import { builtinModules } from "module"` (Node built-in, no package needed)
- Use `...builtinModules` in the `external` array
- Remove `builtin-modules` from `devDependencies` in package.json and run `npm install`

### main.ts
1. Remove `MarkdownView` from import line (unused)
2. Add `void` to unawaited promise calls:
   - Ribbon callback: `void this.generateTagsForActiveFile()`
   - Command callback: `void this.generateTagsForActiveFile()`
   - Batch proceed button: `void this.processBatch()`
3. Fix `showTagPreviewModal` callback — callback is typed void but returns Promise; use `void applyTagsToFile(...).then(...)` pattern
4. Fix catch block at line 100: `error instanceof Error ? error.message : String(error)`
5. Fix `getVaultTags` any cast: `(this.app.metadataCache as unknown as { getTags(): Record<string, number> }).getTags()`
6. Replace heading element (line 326): `containerEl.createEl('h2', ...)` → `new Setting(containerEl).setName(i18n.t('settings.title')).setHeading()`
7. Remove all 4 `.setDynamicTooltip()` calls (lines 381, 393, 446, 458) — deprecated since 1.13.0
8. Keep `display()` method as-is — `getSettingDefinitions` migration is a full API rewrite, out of scope

### ai-service.ts
1. Add `requestUrl` to obsidian import
2. Add typed interfaces before class definition:
   ```ts
   interface OpenAIResponse { choices: Array<{ message: { content: string } }> }
   interface ClaudeResponse { content: Array<{ text: string }> }
   ```
3. Replace `setTimeout` with `window.setTimeout` (line 54)
4. Replace both `fetch(...)` calls with `requestUrl({url, method, headers, body})`:
   - Remove `if (!response.ok)` checks (requestUrl throws on non-2xx automatically)
   - Change `await response.json()` to `response.json as OpenAIResponse` / `ClaudeResponse` (already parsed, not a promise)
5. Fix all catch blocks: `error instanceof Error ? error.message : String(error)`

### rate-limiter.ts
- Replace `setTimeout` with `window.setTimeout` (line 32)

### i18n.ts
- Add `: string` type annotation to `paramKey` in the `.replace()` callback (line 183)

---

## Verification
- `npm run build` must pass with no TypeScript errors
- Re-run Obsidian scanner — error count should be 0, warnings resolved
- Commit, push, update release 1.2.1 assets
