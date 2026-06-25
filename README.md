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
- **Per-video stats** — counts completed full loops and sums their real elapsed
  time (segment length divided by playback speed), shown as total played time
  (in the panel and next to each saved video).
- **Saved videos** — save the current video together with its settings (and
  title) to a list, opened as a drawer sliding in from the right edge. Clicking an
  entry loads its settings; if you are not on that video, it navigates there first.
- Markers highlighting the segment on the player's progress bar.
- A 🔁 button in the player control bar that toggles the control panel.
- A draggable floating panel; settings remembered per video
  (`chrome.storage.local`).
- Works with YouTube's SPA navigation (switching videos without a page reload).

## Installation (developer mode)

1. Open `chrome://extensions` (or `edge://extensions`, `brave://extensions`,
   `opera://extensions`).
2. Enable **Developer mode** (top-right corner).
3. Click **Load unpacked** and select this folder.
4. Open any video: `https://www.youtube.com/watch?v=...`.

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
- **⏮ To start** — jump to the start of the segment (resets the speed).
- **✕ Clear** — remove the loop settings for the current video.
- **★ Save** — add the current video and its settings to the saved list.
- **☰ Saved** (or the "★ Saved" tab on the right edge) — open the saved-videos
  drawer; click an entry to load it (navigating to that video if needed), or ✕ to
  remove it.
- **Space** — toggle stop / restart-from-start (see Features).

## Files

- `manifest.json` — extension configuration (MV3).
- `content.js` — loop logic + control panel, injected into the YouTube page.
- `content.css` — panel and marker styles.
- `icons/` — extension icons.
