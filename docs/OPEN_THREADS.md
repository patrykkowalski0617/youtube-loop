# Open threads

Stable ids; never renumber. Closed items move to the bottom with the date.

| id  | thread                                                                                                                                                    | why deferred                                                                                                     | resumes when                                                             |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| T4  | Move `example.html` under `docs/fixtures/` or drop it.                                                                                                    | It is referenced only by humans; see `docs/KEEP.md`.                                                             | The user decides.                                                        |
| T7  | Sync merges whole video documents, last write wins by `updatedAt`. Two devices editing the same video between pulls can drop one side's practice seconds. | Single-device use makes this theoretical.                                                                        | The user starts using a second device.                                   |
| T8  | `firestore.rules` is in the repo but deployed by hand.                                                                                                    | No Firebase CLI wired into the project yet.                                                                      | The rules need to change again.                                          |
| T9  | The service worker pulls on sign-in and on its own start, never while a tab stays open (no `onSnapshot` in the lite SDK).                                 | Enough for one device; realtime would mean the full Firestore build in MV3.                                      | The user wants live cross-device updates.                                |
| T13 | The looper drives `video.playbackRate` directly; if YouTube ever re-asserts its own rate the handover has to go through the player API in the page world. | Not observed: with the looper off YouTube's menu stayed on Normal, so nothing fights the write.                  | Disabling the looper leaves the video at the looper's rate again.        |
| T14 | Tag colours live in a local registry (`ytloop:tags`); a video's tag names sync, the hue picked for a tag does not.                                        | Sync carries video documents, not shared dictionaries; a second device would pick its own hue for the same name. | The user tags videos on two devices and the colours disagree.            |
| T15 | The tombstone path in `runFullSync`/`pushVideos` (deleting the remote document for a removed video) has no automated test.                                | The project has no fake for the Firestore lite SDK, and the storage side of the deletion is covered.             | The sync protocol changes again, or a second device appears.             |
| T16 | A mark readout renders `h:mm:ss.hh` past the hour and can outgrow the half-width mark in the panel.                                                       | The videos in use are shorter, and dropping the hundredths above an hour would trade the new precision for fit.  | The user loops inside a video longer than an hour and the readout clips. |

## Closed

- **T3** — Licence. Closed 2026-09-25: the author keeps all rights, so `LICENSE` states proprietary, all rights reserved, and `package.json` is marked `UNLICENSED`.

- **T11** — Two sources of truth for `ytloop-active`. Closed 2026-09-25: the class name lives in `src/ui/dom.ts` as `ACTIVE_BUTTON_CLASS` and both the player button and the panel read it from there.
- **T1** — Manual smoke test of v2.0.0 on YouTube. Closed 2026-09-22: the user confirmed the panel, loop and saved list work after loading `dist/`.
- **T5** — Force-push of the rewritten history. Closed 2026-09-22: `origin/main` carries the rewritten commits with no attribution trailers, and `backup/pre-rewrite` is gone.
- **T12** — Moving the fragment controls onto the timeline. Closed 2026-09-23: the bars load, annotate and remove fragments, the deck holds the add button, and the chip list was deleted.
- **T10** — Token migration. Closed 2026-09-22: `tokens.css` is OKLCH primitives plus semantic roles derived with `color-mix`, with scales for spacing, radius, type, duration and control heights; `npm run lint:css` keeps raw colour out of the feature stylesheets.
- **T6** — Sign-in and sync end to end in Opera. Closed 2026-09-22: `chrome.identity.launchWebAuthFlow` works, documents appear under `users/{uid}/videos`, and a removed saved video no longer comes back after a pull.
- **T2** — Tests for the DOM layer. Closed 2026-09-22: `player/markers`, `ui/drag`, `ui/chart`, `ui/drawer` and `ui/account` have jsdom tests, each verified against a mutation.
