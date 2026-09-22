# Changelog

## 2.9.3 — 2026-09-23

- Dropped the fragment tree helper and the strings the chip list used; the
  timeline expresses nesting with lanes, so nothing consumed them any more.

## 2.9.2 — 2026-09-23

- A space typed into a note really stops at the note now: YouTube starts
  playback from key-up, which the previous fix did not cover.

## 2.9.1 — 2026-09-23

- A space typed into a fragment note no longer plays the video: the note field
  lived inside a button, could not take focus, and the extension's own space
  shortcut fired against the bar.
- Clicking away from a note closes the editor instead of leaving the bar
  expanded.

## 2.9.0 — 2026-09-23

- Fragments live on the timeline only. The chip list is gone: the bars above
  the progress bar load, annotate and remove fragments, and the panel's
  start/end block gained the button that saves the marked range.
- The start and end readouts sit on one row with their label, the timer button
  and the new save key, instead of spreading over two.
- Typing in a note no longer reaches YouTube's keyboard shortcuts, so a space
  is a space rather than play/pause.

## 2.8.0 — 2026-09-22

- Timeline bars are tall enough to hit, carry their note as a label and take
  a double click to write or change it. Longer fragments sit above shorter
  ones, and the strip clears YouTube's progress bar when it grows on hover.
- The note editor is one component now, shared by the chips and the bars.

## 2.7.0 — 2026-09-22

- Fragments are drawn as bars just above the progress bar, each spanning the
  part of the video it covers. Overlapping fragments stack onto their own
  lanes, the current one is highlighted, and clicking a bar loads it. The strip
  belongs to the player rather than the control bar, so it stays put when
  YouTube hides its own chrome.

## 2.6.3 — 2026-09-22

- Fragments nest. A fragment whose range sits inside another is shown as its
  sub-fragment, and the parent chip widens to span them. Nesting follows from
  the times alone, so marking a narrower range and pressing "+ Add" files it
  under the right parent with no extra step. A sub carries the same note,
  editing and removal as any other fragment.
- The fragments section sits on its own surface, and the loop times take less
  room now that they no longer have to shout.

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
