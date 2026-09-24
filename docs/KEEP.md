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
- `src/player/timeline.ts` appends its strip to the player element, not to
  `.ytp-chrome-bottom`, and measures the progress bar to align itself. Moving
  it inside the chrome would be tidier and would make it vanish every time
  YouTube autohides the controls, which is the one thing it must not do. It
  also skips repositioning when the measured bar has zero width, because a
  collapsed rect would otherwise slam the strip into the corner.
- Timeline bars are `div[role="button"]`, not `<button>`. A button may not
  contain an input, so the note field could not take focus and keystrokes were
  reported against the bar - which made the extension's own space shortcut
  play the video while someone was typing.
- `isEditableTarget` checks `document.activeElement` as well as the event
  target. Some hosts report a key event against an ancestor, and the space
  shortcut must never fire while a field has focus.
- The note editor shields `keydown`, `keyup` and `keypress`, not just
  `keydown`. YouTube toggles playback from `keyup`, so shielding one event
  type let a typed space start the video. `isEditingNote()` additionally stands
  the extension's own space shortcut down while a note is open, so the fix does
  not rest on listener ordering alone.
- The target burst fires on a false-to-true transition held in `src/ui/burst.ts`,
  and the first call only records the state. Firing on the value itself would
  repeat the burst on every status refresh, and firing on the first call would
  set one off just for opening the panel on a video already at its target.
- Each burst's teardown timer closes over its own element, so a stale timer can
  only remove a node that is already detached. That is why there is no timer
  handle to cancel.
- `npm run lint:css` checks that every `var(--x)` resolves against
  `src/styles/tokens.css`. An undefined custom property makes the whole
  declaration invalid at computed-value time, so a rule silently renders
  nothing - a burst effect once shipped with no border, no blur and no scale
  because three tokens were missing, and both the build and the tests passed.
- Text fields that live on a YouTube page shield their own keystrokes through
  `src/ui/keyShield.ts` and detach the shield when they go away. Skipping the
  detach leaks a window listener on every drawer remount, and skipping the
  shield lets a typed space reach YouTube's player controls.
- `src/player/speed.ts` compares an incoming rate against `store.appliedSpeed`
  instead of raising a flag around the write. `ratechange` fires asynchronously,
  so a flag set and cleared around `video.playbackRate = x` is already down when
  the event lands, and the looper's own rate gets recorded as the viewer's
  choice - which is what made a disabled looper keep playing at 0.5.
- `adoptVideoSpeed()` runs on `loadedmetadata`, not only when the video element
  is attached. YouTube reuses the same `<video>` across navigations and resets
  its own speed to Normal, so without it the remembered "YouTube speed" survives
  from the previous video and is handed back on the next release.
- `src/styles/tags.css` is the one place outside `tokens.css` that composes a
  colour: `--tag-color: oklch(var(--tag-lightness) var(--tag-chroma)
var(--ytloop-tag-hue))`. A custom property containing `var()` is substituted
  on the element it is declared on, so the composition cannot live in
  `tokens.css` - there the per-chip hue would always resolve to the `:root`
  default. Lightness and chroma stay tokens, and every other tag rule mixes
  `var(--tag-color)`.
- `src/ui/panelTags.ts` reads Enter and Escape through `shieldKeys`, not through
  its own `keydown` listener. The shield stops immediate propagation at the
  window in capture, so a listener on the field itself never runs.
- The tag field builds its own suggestion list instead of a native `datalist`.
  The browser renders a datalist popup in its own chrome - unstyled, wrongly
  placed against a fixed panel on a YouTube page, and with no colour swatch, so
  nothing tied it to the field that opened it.
- Suggestion rows commit on `mousedown` with `preventDefault`, not on `click`.
  A click would first blur the field, and the blur handler closes the editor and
  commits whatever was typed, so the pick would never arrive.
- The panel's stored position is a share of the free space (0-1 per axis), not a
  pixel offset. A pixel offset saved in a wide window drops the panel outside a
  narrow one, and a panel parked at the right edge has to stay at the right edge
  when the window changes. `panelLeft`/`panelTop` from before the change
  normalise into that range, so an old value lands at an edge instead of off
  screen.
- `applyStoredPanelPosition` skips a hidden panel: `offsetWidth` reads 0 while
  the `hidden` attribute is set, so the placement would be computed against a
  panel of no size. Showing the panel applies the position again.
