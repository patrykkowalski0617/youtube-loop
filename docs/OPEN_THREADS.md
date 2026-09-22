# Open threads

Stable ids; never renumber. Closed items move to the bottom with the date.

| id  | thread                                                                                                                                                    | why deferred                                                                  | resumes when                              |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------- |
| T3  | `LICENSE` file.                                                                                                                                           | Choice of licence is the author's.                                            | The user picks one.                       |
| T4  | Move `example.html` under `docs/fixtures/` or drop it.                                                                                                    | It is referenced only by humans; see `docs/KEEP.md`.                          | The user decides.                         |
| T7  | Sync merges whole video documents, last write wins by `updatedAt`. Two devices editing the same video between pulls can drop one side's practice seconds. | Single-device use makes this theoretical.                                     | The user starts using a second device.    |
| T8  | `firestore.rules` is in the repo but deployed by hand.                                                                                                    | No Firebase CLI wired into the project yet.                                   | The rules need to change again.           |
| T9  | The service worker pulls on sign-in and on its own start, never while a tab stays open (no `onSnapshot` in the lite SDK).                                 | Enough for one device; realtime would mean the full Firestore build in MV3.   | The user wants live cross-device updates. |
| T11 | `ytloop-active` is declared as a constant in both `ui/playerButton.ts` and `ui/panelVisibility.ts`, so the class name has two sources of truth.           | Found while restoring the player-button styles, in files outside that change. | The next task touches either module.      |

## Closed

- **T1** — Manual smoke test of v2.0.0 on YouTube. Closed 2026-09-22: the user confirmed the panel, loop and saved list work after loading `dist/`.
- **T5** — Force-push of the rewritten history. Closed 2026-09-22: `origin/main` carries the rewritten commits with no attribution trailers, and `backup/pre-rewrite` is gone.
- **T10** — Token migration. Closed 2026-09-22: `tokens.css` is OKLCH primitives plus semantic roles derived with `color-mix`, with scales for spacing, radius, type, duration and control heights; `npm run lint:css` keeps raw colour out of the feature stylesheets.
- **T6** — Sign-in and sync end to end in Opera. Closed 2026-09-22: `chrome.identity.launchWebAuthFlow` works, documents appear under `users/{uid}/videos`, and a removed saved video no longer comes back after a pull.
- **T2** — Tests for the DOM layer. Closed 2026-09-22: `player/markers`, `ui/drag`, `ui/chart`, `ui/drawer` and `ui/account` have jsdom tests, each verified against a mutation.
