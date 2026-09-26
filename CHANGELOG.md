# Changelog

## 2.25.2 — 2026-09-26

- The drawer's scrollbar no longer sits on top of the right-hand column. The
  scrolling body keeps a gutter whether or not the bar is showing, so the layout
  does not shift either.
- Counts in a bar list are written as ×7 instead of spelling out the word. In
  Polish the spelled form wrapped onto a second line inside a column sized for
  English.

## 2.25.1 — 2026-09-26

- Saved videos is the first tab in the side drawer and the one it opens on. The
  library is what the drawer is reached for most often; the statistics are a
  place you go deliberately.

## 2.25.0 — 2026-09-26

- The two side drawers became one, with tabs for Statistics, Saved videos and
  Settings. A single handle now opens everything, so the dock no longer stacks
  two labels and the practice figures, the library and the options sit behind one
  surface instead of three.
- The extension speaks Polish as well as English. The language lives in the
  settings tab: one row showing the active language in its own tongue, opening a
  list of the supported ones, each written in its own tongue with a check on the
  active entry. Picking a language applies it at once and re-renders every label
  without a reload; the choice is stored and survives a restart. With nothing
  stored the browser locale decides, falling back to English.
- Sign-in and sync moved out of the statistics view into the settings tab, where
  they belong.

## 2.24.0 — 2026-09-25

- The practice drawer was rebuilt around measured data instead of two unlabelled
  numbers. Practice time is now timed with the wall clock while the video plays
  rather than derived from segment length divided by playback rate, so pauses,
  gaps and abandoned passes no longer distort it. Every figure carries a label
  and a sentence saying what it counts.
- New measurements: finished and abandoned repetitions, completion rate, average
  repetition and segment length, practice sessions split by a ten-minute break,
  current and longest streak, hour-of-day distribution, repetitions per tempo,
  watched-but-not-looped time, paused and gap time, week-against-week trends,
  per-fragment practice time and the day the target tempo was first held.
- Tempo is recorded in fixed-speed mode too, and the all-time best tempo no
  longer expires with the thirty-day window.
- The chart reads in English, prints its values and dates on the bars instead of
  hiding them in tooltips, carries a legend, and can show 7, 30 or 90 days. A
  scope switch shows either the current video or every video at once, with a
  ranking and a breakdown by tag.
- The saved list can be sorted by most played, recently played, title or the
  previous recently-saved order, and each card says when it was last played.
- Undo now removes the whole last repetition, not only its tempo record.

## 2.23.3 — 2026-09-25

- Moved the saved YouTube page used for checking DOM selectors into
  `docs/fixtures/`, where it reads as reference material instead of source.

## 2.23.2 — 2026-09-25

- Added a proprietary licence. The code stays readable in the repository but
  carries no permission to use, copy or redistribute it.

## 2.14.0 — 2026-09-23

- The saved-videos drawer has a search box. It filters on video titles and on
  the notes written on their fragments at once, every typed word has to match
  somewhere, and an empty result says so rather than looking like an empty
  library.

## 2.13.0 — 2026-09-23

- A saved video's card lists the notes written on its fragments, so the list
  says what is waiting in each video rather than only how many pieces it holds.
  Fragments without a note are skipped, and a video with more notes than fit
  shows a count of the rest.

## 2.12.1 — 2026-09-23

- Dragging a number field works again. It had been disabled for any field that
  already held focus, which every click left behind, and the browser was free
  to start a text selection under the drag. A click without a drag now selects
  the value so it can be typed over.

## 2.12.0 — 2026-09-23

- Reaching the target tempo glows again and fires a single ring from the panel
  outline that sweeps the viewport. Its reach comes from the window and its
  duration from the distance it travels, so the wave moves at one speed on any
  screen instead of racing across a large one.
- Saving a video by hand is gone - adding a fragment already files it - so the
  Save video and Library buttons went with it, and Play from start moved into
  the space they left.
- The saved-videos tab on the right edge is larger.
- The stylesheet lint now fails on a custom property used without a definition.

## 2.11.0 — 2026-09-23

- Reaching the target tempo glows properly again - a slow ember pulse around
  the whole panel - and fires a one-shot burst: two rings in the panel's own
  outline, expanding outward and fading. It fires once per arrival, never on
  a refresh, and stands down under reduced motion.

## 2.10.0 — 2026-09-23

- Saving a video by hand is gone: adding a fragment already files the video in
  the saved list, so the button and the panel's Library duplicate went with it.
- Play from start moved to the bottom of the panel, into the space the removed
  section left.
- The saved-videos tab on the right edge of the page is larger.

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
