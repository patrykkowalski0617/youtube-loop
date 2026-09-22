# Changelog

## 2.1.1 — 2026-09-22

- Tests for the DOM layer: progress-bar markers, panel dragging, the practice
  chart, the saved-videos drawer and the account row. No behaviour change.

## 2.1.0 — 2026-09-22

- Optional Google sign-in and cloud sync: saved videos, fragments and practice
  stats mirror to Firestore per account, so they survive a reinstall.
- New MV3 service worker holding Firebase; the content script keeps working
  signed-out and never loads the SDK.
- Fixed extension id (`key` in the manifest) so `chrome.storage.local` no longer
  depends on which folder is loaded unpacked.

## 2.0.0 — 2026-09-21

- Project restructured into modules under `src/` (core, storage, youtube,
  player, ui, i18n, styles) and converted to TypeScript. Behaviour unchanged.
- Build with Vite + CRXJS; `npm run build` produces `dist/` and a release zip.
- ESLint, Prettier, Vitest and a GitHub Actions workflow.
- `npm run dev:playground`: a standalone page with a mock YouTube player for
  live layout work.
- All colours moved to CSS custom properties in `src/styles/tokens.css`.

## 1.8.0 and earlier

See the git history.
