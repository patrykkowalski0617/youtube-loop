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
- `src/testing/chromeMock.ts` looks like production code but is only imported by
  `*.test.ts`. It is excluded from coverage and never reaches a bundle; the
  playground has its own separate storage mock because it runs in a real page.
- The panel and the practice chart are shown and hidden with the `hidden`
  attribute, never `style.display`. An inline `display` overrides the
  stylesheet's `display: flex`, which silently disables every `gap` in the
  layout - the bug that made the redesign look unspaced no matter what the gap
  tokens said. `#ytloop-panel[hidden]` and `.ytloop-chart[hidden]` exist for
  this reason.
- Hairline borders stay `1px` and a component's own geometry (switch track and
  knob, chevron, shadow offsets) stays literal in its rule. Only values that
  repeat as decisions - spacing, radius, type, duration, control heights -
  are tokens.
- The two `!important` declarations in `src/styles/player-button.css` override
  YouTube's own `.ytp-button` rules for display and padding; without them the
  loop icon sits at the wrong size and offset among the native controls. The
  icon is 24x24 and inherits white, turning brand red only while the panel is
  open - it has to read as one of YouTube's buttons, not as ours.
