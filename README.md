# YouTube Loop 🔁

A browser extension (Chrome / Edge / Brave / Opera — Manifest V3) that lets you
mark the **start** and **end** of a loop on a YouTube video and replay the chosen
segment over and over.

## Features

- Set the start and end of the loop with the **⏱ Now** button (grabs the current
  video time) or type them manually (`m:ss`, `h:mm:ss`, or plain seconds).
- Loop toggle — when the video reaches the end it automatically jumps back to the
  start.
- **Gap ("tail") between replays** — a pause between consecutive loops, 1 s by
  default, editable, stored globally.
- **Constant speed** — optionally play the loop at a fixed playback speed (range
  0.25–2x); stored per video.
- **Gradual speed change** — optionally each loop gets faster (or slower) by a
  given step, from a start speed to a target speed (range 0.25–2x); stored per
  video. When the target is reached the panel lights up with an animated ember
  glow and an orbiting reflection. (Constant and gradual are mutually exclusive;
  both can be off.)
- **Spacebar control** (while the loop is active): if the video is playing, space
  stops it (the current speed stays, visible in the UI); if it is stopped, space
  jumps to the segment start and plays from the start speed.
- **Per-video stats** — sums the real elapsed time of completed full loops
  (segment length divided by playback speed), shown as total played time (in the
  panel and next to each saved video), plus a **"Last 7 days" bar chart** with the
  daily fastest tempo above each bar.
- **Fastest tempo** — only in the **Gradually change speed** mode, the highest
  speed at which a loop was played in full is tracked per day; the overall record
  is shown under the chart with a
  **"Don't count last record"** button to undo the most recent record (e.g. after
  a fluke or scrubbing).
- **Fragments** — a column on the right side of the panel with the saved
  segments of the current video, labelled by their start and end and always
  ordered chronologically by start. **+ Add** stores the current start/end as a
  fragment (and saves the video to the list if it is not there yet); clicking a
  fragment loads its start and end; ✕ (on hover) removes it.
- **Saved videos** — save the current video together with its settings (and
  title) to a list, opened as a drawer sliding in from the right edge. Clicking an
  entry loads its settings; if you are not on that video, it navigates there first.
- Markers highlighting the segment on the player's progress bar.
- A 🔁 button in the player control bar that toggles the control panel.
- A draggable floating panel; settings remembered per video
  (`chrome.storage.local`).
- Works with YouTube's SPA navigation (switching videos without a page reload).

## Installation (from a release zip)

1. Run `npm run build` (or download `release/youtube-loop-<version>.zip` from CI)
   and unpack it, or use the `dist/` folder directly.
2. Open `chrome://extensions` (or `edge://extensions`, `brave://extensions`,
   `opera://extensions`).
3. Enable **Developer mode** (top-right corner).
4. Click **Load unpacked** and select the `dist/` folder.
5. Open any video: `https://www.youtube.com/watch?v=...`.

The floating "🔁 Loop segment" panel appears in the top-right corner.

## Usage

1. Scrub the video to where the loop should start → click **⏱ Now** next to
   "Start".
2. Scrub to the end of the segment → click **⏱ Now** next to "End".
   (You can also type the times manually, e.g. `1:30` and `2:05`.)
3. Turn on **Enable**. The video will replay the segment in a loop.

- **Gap between loops (s)** — pause between consecutive replays.
- **Gradually change speed** — set Start / Target / Step to ramp the speed across
  loops (defaults: start `0.65`, target `1`, step `0.05`).
- **⏮ Play from beginning** — jump to the start of the segment (resets the speed).
- **✕ Clear** — remove the loop settings for the current video.
- **+ Add** (Fragments column) — save the current start/end as a fragment of this
  video; click a fragment to load it back, ✕ to remove it.
- **★ Save** — add the current video and its settings to the saved list.
- **☰ Saved** (or the "★ Saved" tab on the right edge) — open the saved-videos
  drawer; click an entry to load it (navigating to that video if needed), or ✕ to
  remove it.
- **Space** — toggle stop / restart-from-start (see Features).

## Account and cloud sync (optional)

Signing in with Google mirrors the saved videos, fragments and practice stats to
Firestore under `users/{uid}/videos/{videoId}`, so they survive reinstalling the
extension and follow you to another machine. Everything works signed out —
`chrome.storage.local` stays the source of truth and the cloud is a mirror.

The panel shows a sign-in row only when the build has Firebase credentials
(`.env.local`, see `.env.example`); without them the row is hidden and no
Firebase code is loaded.

How it fits together:

- The **service worker** (`src/background/`) owns Firebase. Sign-in uses
  `chrome.identity.launchWebAuthFlow` to get a Google `id_token`, then
  `signInWithCredential`; no offscreen document and no hosted page are needed.
- The **content script never loads the SDK** — it talks to the worker with
  `chrome.runtime.sendMessage`. Keeping the ~160 KB SDK off every YouTube page is
  why `src/sync/index.ts` exports only the SDK-free modules.
- A pull runs on sign-in and on worker start; pushes are debounced 1.5 s after a
  change. Conflicts resolve per video by `updatedAt`, newest wins.
- `firestore.rules` restricts every document to its owner: `request.auth.uid == uid`.

## Development

Requires Node 22 (`.nvmrc`).

```sh
npm install
npm run dev              # Vite + CRXJS: load dist/ unpacked once, then edits hot-reload on youtube.com
npm run dev:playground   # standalone page with a mock player - tweak the layout without YouTube
npm run check            # typecheck + lint + format check + tests
npm run build            # dist/ + release/youtube-loop-<version>.zip
```

`npm run dev` writes a development build to `dist/`; load that folder as an
unpacked extension and keep the dev server running — content-script and CSS
changes are hot-reloaded on the YouTube tab.

`npm run dev:playground` opens `http://localhost:5173/watch?v=playground`, a
page with a fake YouTube player (`#movie_player`, progress bar, control bar) and
a CC0 sample video. `chrome.storage` is mocked with `localStorage`, so saved
videos, fragments and stats persist between reloads; the header has a dark-theme
toggle and a reset button.

### Layout

```
src/
  content/   entry point (bootstrap, SPA navigation, Space key, marker tick)
  core/      pure logic: time, speed, fragments, stats, settings - no DOM, no chrome.*
  storage/   the only place that touches chrome.storage
  youtube/   the only place that knows YouTube's DOM
  player/    loop engine driving the <video> element, progress-bar markers, store
  ui/        panel, drawer, chart, fragments list, player button, drag
  sync/      sign-in and the Firestore mirror (index.ts is SDK-free on purpose)
  background/ MV3 service worker: the only place the sync engine runs
  i18n/      every user-visible string
  styles/    tokens.css (all colours) + one CSS file per feature
playground/  mock YouTube page for live layout work
docs/        plan, open threads, things that look removable but are not
```

Working rules for contributors (and for Claude) live in `CLAUDE.md`.

## Licence

Copyright (c) 2026 Patryk Kowalski. All rights reserved. This code is
proprietary: it may be read here, but not used, copied, modified or
redistributed without written permission. See `LICENSE`.
