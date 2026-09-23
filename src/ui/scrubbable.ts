import {
  nudgeValue,
  SCRUB_DEAD_ZONE_PX,
  type ScrubModifiers,
  type ScrubRange,
  scrubValue,
} from "../core";

const DRAGGING_CLASS = "is-scrubbing";
const PRIMARY_BUTTON = 0;
const ARROW_UP = "ArrowUp";
const ARROW_DOWN = "ArrowDown";
const TOWARDS_MORE = 1;
const TOWARDS_LESS = -1;

export interface ScrubbableOptions {
  step: number;
  range?: ScrubRange;
  read: () => number;
  format: (value: number) => string;
  commit: (value: number) => void;
}

function apply(input: HTMLInputElement, value: number, options: ScrubbableOptions): void {
  input.value = options.format(value);
  options.commit(value);
}

export function makeScrubbable(input: HTMLInputElement, options: ScrubbableOptions): void {
  let pointerId: number | null = null;
  let originY = 0;
  let base = 0;
  let moved = false;

  input.addEventListener("pointerdown", (e) => {
    if (e.button !== PRIMARY_BUTTON) return;
    e.preventDefault();
    pointerId = e.pointerId;
    originY = e.clientY;
    base = options.read();
    moved = false;
    input.setPointerCapture(e.pointerId);
  });

  input.addEventListener("pointermove", (e) => {
    if (pointerId !== e.pointerId) return;
    const deltaUp = originY - e.clientY;
    if (!moved && Math.abs(deltaUp) < SCRUB_DEAD_ZONE_PX) return;
    moved = true;
    input.classList.add(DRAGGING_CLASS);
    e.preventDefault();
    apply(input, scrubValue(base, deltaUp, options.step, e, options.range), options);
  });

  const nudge = (direction: number, modifiers: ScrubModifiers): void => {
    apply(
      input,
      nudgeValue(options.read(), direction, options.step, modifiers, options.range),
      options,
    );
  };

  const endDrag = (e: PointerEvent): void => {
    if (pointerId !== e.pointerId) return;
    if (input.hasPointerCapture(e.pointerId)) input.releasePointerCapture(e.pointerId);
    pointerId = null;
    input.classList.remove(DRAGGING_CLASS);
    if (moved) {
      e.preventDefault();
      return;
    }
    input.focus();
    input.select();
  };

  input.addEventListener("pointerup", endDrag);
  input.addEventListener("pointercancel", endDrag);

  input.addEventListener("keydown", (e) => {
    if (e.key !== ARROW_UP && e.key !== ARROW_DOWN) return;
    e.preventDefault();
    nudge(e.key === ARROW_UP ? TOWARDS_MORE : TOWARDS_LESS, e);
  });

  input.addEventListener(
    "wheel",
    (e) => {
      if (document.activeElement !== input) return;
      e.preventDefault();
      nudge(e.deltaY < 0 ? TOWARDS_MORE : TOWARDS_LESS, e);
    },
    { passive: false },
  );
}
