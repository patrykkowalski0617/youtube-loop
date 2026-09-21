# Things that look removable but are not

Check this list before every cleanup.

- `example.html` — a saved YouTube watch page (≈6 MB). Reference for the DOM
  selectors in `src/youtube/`. Not loaded by anything; keep it out of the
  bundle and out of lint.
- `src/content/index.ts` listens to `yt-navigate-finish` on both `window` and
  `document`. YouTube has dispatched it on either target depending on the
  build; both are needed.
- The `MutationObserver` in `src/content/index.ts` looks redundant next to the
  navigation listener. It is the first-entry path: on a cold load the video
  element and control bar appear after `document_idle`.
- `src/player/loop.ts` enforces play/pause for several frames after Space.
  YouTube's own keyboard handler flips the state back on the next tick; a
  single call is not enough.
- `key` in `manifest.json` pins the extension id to
  `fpjdagokmjppmjhphjfddgfkkjiidbdp` regardless of which folder is loaded
  unpacked. Without it Chrome derives the id from the folder path, and
  `chrome.storage.local` (saved videos, fragments, stats) is tied to the id — so
  loading `dist/` after the root folder looked like all data was gone. Do not
  remove or regenerate it.
