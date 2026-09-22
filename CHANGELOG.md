# Changelog

## 2.5.0 — 2026-09-22

- Every fragment can carry a note, shown on its own line above the time on the
  chip. Hover a chip and click the pencil to write one; Enter saves, Escape
  discards. Notes ride along to Firestore with the rest of the video.

## 2.4.2 — 2026-09-22

- Restored the player-bar icon to its original 24px, white, YouTube-native
  appearance; the redesign had dropped the rules that keep it in line with the
  native controls.

## 2.4.1 — 2026-09-22

- Panel redesigned: one compact column, the loop times as the only large
  element, tempo and the library always visible, practice stats collapsed.
- The two mutually exclusive speed switches became one three-way choice
  (Full speed / Fixed / Ramp), and only the fields for the chosen mode show.
- Number fields respond to a vertical drag, arrow keys and the wheel, with
  Shift for coarse and Alt for fine steps.
- Every visual value now comes from `src/styles/tokens.css`: OKLCH primitives,
  semantic roles derived with `color-mix`, and scales for spacing, radius,
  type and duration.
- Fixed the panel being shown with an inline `display`, which overrode the
  stylesheet's flex layout and disabled every gap in it.

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
