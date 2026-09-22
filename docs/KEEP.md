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
- `src/sync/index.ts` deliberately omits `firebase.ts`, `engine.ts`, `googleAuth.ts` and
  `firestoreVideos.ts`. The omission is the mechanism that keeps the Firebase SDK out
  of the content-script bundle; `src/sync/internal.ts` is the barrel the service
  worker uses. Do not "fix" the public barrel by exporting everything.
- `src/sync/config.ts` holds only object literals and imports no SDK, so the content
  script may import it eagerly. Keep it that way.
- `.env.local` holds the Firebase config; it is gitignored on purpose even though the
  values are public identifiers, so that a fork does not silently write to this
  project's database. `.env.example` documents the shape.
- `src/background/service-worker.ts` is deliberately not named `index.ts`. CRXJS
  names built chunks after the entry file, so a second `index.ts` entry collides
  with the content script's and the service-worker loader silently ends up
  importing the content-script chunk. Renaming it back breaks sync with no error
  in the build output.
