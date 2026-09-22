import { nudgeValue, SCRUB_DEAD_ZONE_PX, type ScrubRange, scrubValue } from "../core";

const DRAGGING_CLASS = "is-scrubbing";
const ARROW_UP = "ArrowUp";
const ARROW_DOWN = "ArrowDown";

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
    if (e.button !== 0 || document.activeElement === input) return;
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

  const endDrag = (e: PointerEvent): void => {
    if (pointerId !== e.pointerId) return;
    if (input.hasPointerCapture(e.pointerId)) input.releasePointerCapture(e.pointerId);
    pointerId = null;
    input.classList.remove(DRAGGING_CLASS);
    if (moved) e.preventDefault();
    else input.focus();
  };

  input.addEventListener("pointerup", endDrag);
  input.addEventListener("pointercancel", endDrag);

  input.addEventListener("keydown", (e) => {
    if (e.key !== ARROW_UP && e.key !== ARROW_DOWN) return;
    e.preventDefault();
    const direction = e.key === ARROW_UP ? 1 : -1;
    apply(input, nudgeValue(options.read(), direction, options.step, e, options.range), options);
  });

  input.addEventListener(
    "wheel",
    (e) => {
      if (document.activeElement !== input) return;
      e.preventDefault();
      const direction = e.deltaY < 0 ? 1 : -1;
      apply(input, nudgeValue(options.read(), direction, options.step, e, options.range), options);
    },
    { passive: false },
  );
}
