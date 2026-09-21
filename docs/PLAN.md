# Restructuring plan (v2.0.0)

Goal: turn the single-file content script into a conventional, tested,
buildable project without changing behaviour.

## Decisions

| id  | decision                                                                  | why                                                                                                                                                                                                                                                         |
| --- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Vite 8 + `@crxjs/vite-plugin` 2.x                                         | The extension is a single content script with no popup or background. CRXJS keeps `manifest.json` explicit, adds content-script HMR and stays a plain Vite project; WXT would impose its `entrypoints/` convention and generated manifest for no gain here. |
| D2  | TypeScript, `strict`                                                      | Catches the `null`/`undefined` juggling that the state object relies on. `@types/chrome` for the storage API.                                                                                                                                               |
| D3  | Vitest + jsdom                                                            | Pure `core` modules are tested in node; `ui`/`player` helpers that need a DOM run under jsdom.                                                                                                                                                              |
| D4  | ESLint 10 flat config + typescript-eslint + simple-import-sort + Prettier | Import groups and formatting enforced by tooling, not by review.                                                                                                                                                                                            |
| D5  | `chrome.storage` wrapped in promises in `src/storage/`                    | Removes callback pyramids in the saved-list and fragment code; the wrapper is the only `chrome.*` user.                                                                                                                                                     |
| D6  | CSS split by feature, colours in `tokens.css`                             | Same selectors as before; only the file boundaries and colour literals change.                                                                                                                                                                              |
| D7  | Release zip produced by the build                                         | `vite-plugin-zip-pack` writes `release/youtube-loop-<version>.zip` from `dist/`.                                                                                                                                                                            |
| D8  | GitHub Actions runs `npm run check` and `npm run build` on push and PR    | Keeps the main branch green.                                                                                                                                                                                                                                |

## Module map

```
src/
  content/index.ts      bootstrap: init, navigation, observer, Space key, marker tick
  core/                 pure: constants, types, time, speed, fragments, stats, snapshot
  storage/              chrome.storage wrappers: video settings, global settings, stats, saved list
  youtube/              DOM selectors, video id, title, navigation URL
  player/               loop engine (timeupdate, tail, restart, Space toggle, ratechange), markers
  ui/                   panel (template, wiring, sync), drawer, chart, fragments list, player button, drag
  i18n/                 strings
  styles/               tokens.css + one file per feature
```

## Steps

1. Toolchain: `package.json`, Vite/CRXJS, TS, ESLint, Prettier, Vitest, CI, zip. ✅
2. `core` modules extracted with tests. ✅
3. `storage`, `youtube`, `player`, `ui`, `i18n`, `styles`. ✅
4. Entry point, manifest pointing at `src/content/index.ts` and `src/styles/content.css`. ✅
5. README/CLAUDE.md/docs updated, version bumped to 2.0.0. ✅
6. `npm run check` and `npm run build` green. ✅ Manual smoke test by the user (T1). ⏳
7. Playground page for live layout work (`npm run dev:playground`). ✅
