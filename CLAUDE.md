# YouTube Loop — working rules

Browser extension (Manifest V3, content script only) that loops a segment of a
YouTube video. Vanilla TypeScript, no UI framework. Build: Vite + CRXJS.
Tests: Vitest. Lint: ESLint + Prettier. Node version in `.nvmrc`.

## Commands

- `npm run dev` — Vite dev server with extension HMR; load `dist/` unpacked.
- `npm run build` — production build into `dist/` plus `release/youtube-loop-<version>.zip`.
- `npm run check` — typecheck + lint + format check + tests. Must pass before any commit.
- `npm test` — Vitest once; `npm run test:watch` for watch mode.

## Layout

- `src/content/` — the single entry point (`index.ts`): bootstraps everything, owns nothing else.
- `src/core/` — pure logic (time, speed, fragments, stats, state shape). No DOM, no `chrome.*`.
- `src/storage/` — the only place that touches `chrome.storage`. Promise-based.
- `src/youtube/` — the only place that knows YouTube's DOM (selectors, video id, title, navigation).
- `src/player/` — loop engine driving the `<video>` element and the progress-bar markers.
- `src/ui/` — panel, drawer, chart, fragments list, player button, drag. Markup + calls into core/player.
- `src/sync/` — Google sign-in and the Firestore mirror. `index.ts` exports only the SDK-free modules (`config`, `messages`, `runtime`); everything that pulls the Firebase SDK is reached through `internal.ts` and must never be imported by `content/` or `ui/`.
- `src/background/service-worker.ts` — the MV3 service worker: the only place that runs the sync engine. Every manifest entry point needs a distinct file name; two entries both called `index.ts` make the build wire one chunk into both loaders.
- `src/i18n/` — every user-visible string.
- `src/styles/` — CSS. `tokens.css` holds every colour and shared measure; other files use `var(--…)` only.
- `src/testing/` — helpers used only by tests (a `chrome.*` mock). Never imported by production modules.
- `docs/` — plan, open threads, and things that look removable but are not.

Every folder has an `index.ts` that only re-exports (`export *`). Import a unit
through its folder (`../core`), never through a deep path.

## Before you change anything

- Read a file before editing it. Grep for every caller before modifying a function.
- Healthy code takes priority over the current task. Fix the cause, not the symptom; park the current task and record where in `docs/OPEN_THREADS.md`.
- Check every file you edit against these conventions without being asked.
- Check `docs/KEEP.md` before removing anything that looks orphaned.

## Writing code

- One source of truth. If a function already does the thing, use it; never add a parallel version.
- No comments in production code or tests, not even "why" comments. Restructure or rename instead. Rationale goes in the commit message body. Tooling directives (`eslint-disable`) are fine.
- No magic values. Every meaningful number or string lives in a named constant.
- UI modules are markup plus calls into `core`/`player`/`storage`. Logic over ~15 lines moves to a helper. A module over ~150 lines is split.
- Pure logic outside UI, no hidden reads of global state where an argument would do, side effects at the edges.
- Named exports only. Imports in fixed groups (node/vite → third-party → project folders → local), alphabetical within each group; `eslint --fix` enforces this.
- Colours only through tokens in `src/styles/tokens.css`.
- UI text only through `src/i18n`. The UI language is English; fix spelling and grammar silently.
- Do not resurrect mechanisms the project deliberately removed, even under a different name.
- Bump `version` in `manifest.json` with every change (patch for fixes, minor for features).

## Tests

- Every module in `src/core` and every helper has a test file next to it (`*.test.ts`).
- DOM modules are tested in jsdom with `// @vitest-environment jsdom` on the first line and `installChromeMock()` from `src/testing`. The default environment is node.
- Order: change → user confirms → tests. Do not freeze unconfirmed behaviour in tests. Say plainly: "when you confirm this works as expected, I'll write the tests."
- A test must be able to fail: break the code, watch it go red, restore.
- Answer questions about domain logic by running the code (throwaway test), not from memory. A probe either becomes a named test or is deleted.

## Verification

- `npm run check` covers all of `src`; confirm `tsconfig.json` includes still match after moving files.
- After touching `src/sync`, `src/ui` or any barrel, rebuild and confirm the Firebase SDK is still absent from the content-script chunk: `npm run build`, then grep the chunk named in `dist/manifest.json` under `content_scripts` for `firestore`. A barrel that re-exports `sync/firebase` drags ~160 KB of SDK onto every YouTube page.
- Report faithfully: failed tests are shown, skipped steps are named, done means verified.

## Git

- Commit only when explicitly told, one permission = one commit. The user is the sole author; no `Co-Authored-By`, no AI attribution.
- Subject: short, sentence case, ends with `(vX.Y.Z)`. Body: prose explaining what was wrong and the non-obvious reasoning — the code has no comments, so the log is the explanatory record.
- Write the message to a file and use `git commit -F`. Stage by naming each path.

## Finishing a task

1. Simplification pass over your own files.
2. Tests for every helper you added or changed (make each go red once).
3. Logic out of UI modules; no magic values.
4. Walk the diff against these rules and name what you checked.
5. `npm run check` green, then report. Leave the work uncommitted unless told otherwise.
