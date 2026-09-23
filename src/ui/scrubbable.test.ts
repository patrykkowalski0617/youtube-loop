// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";

import { SCRUB_DEAD_ZONE_PX, SCRUB_PIXELS_PER_STEP } from "../core";

import { byId } from "./dom";
import { makeScrubbable } from "./scrubbable";

const STEP = 0.05;
const START_VALUE = 1;

let input: HTMLInputElement;
let committed: number[];

const drag = (fromY: number, toY: number): void => {
  input.dispatchEvent(new PointerEvent("pointerdown", { button: 0, clientY: fromY, pointerId: 1 }));
  input.dispatchEvent(new PointerEvent("pointermove", { clientY: toY, pointerId: 1 }));
  input.dispatchEvent(new PointerEvent("pointerup", { clientY: toY, pointerId: 1 }));
};

describe("scrubbable field", () => {
  beforeEach(() => {
    HTMLElement.prototype.setPointerCapture = () => undefined;
    HTMLElement.prototype.releasePointerCapture = () => undefined;
    HTMLElement.prototype.hasPointerCapture = () => false;
    document.body.innerHTML = '<input id="field"><input id="other">';
    input = byId(document, "field") as HTMLInputElement;
    input.value = String(START_VALUE);
    committed = [];
    makeScrubbable(input, {
      step: STEP,
      read: () => Number(input.value),
      format: String,
      commit: (v) => committed.push(v),
    });
  });

  it("raises the value when dragged upwards", () => {
    drag(100, 100 - SCRUB_PIXELS_PER_STEP * 4);
    expect(committed.at(-1)).toBeCloseTo(START_VALUE + STEP * 4);
  });

  it("keeps working when the field already has focus", () => {
    input.focus();
    drag(100, 100 - SCRUB_PIXELS_PER_STEP * 2);
    expect(committed.at(-1)).toBeCloseTo(START_VALUE + STEP * 2);
  });

  it("keeps working on a second drag in a row", () => {
    drag(100, 100 - SCRUB_PIXELS_PER_STEP * 2);
    drag(100, 100 - SCRUB_PIXELS_PER_STEP * 2);
    expect(committed).toHaveLength(2);
    expect(committed.at(-1)).toBeCloseTo(Number(input.value));
  });

  it("does not let the browser start a text selection under the drag", () => {
    const down = new PointerEvent("pointerdown", {
      button: 0,
      clientY: 100,
      pointerId: 1,
      cancelable: true,
    });
    input.dispatchEvent(down);
    expect(down.defaultPrevented).toBe(true);
  });

  it("ignores a twitch smaller than the dead zone", () => {
    drag(100, 100 - (SCRUB_DEAD_ZONE_PX - 1));
    expect(committed).toEqual([]);
  });

  it("hands the field over for typing when clicked without moving", () => {
    drag(100, 100);
    expect(document.activeElement).toBe(input);
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe(input.value.length);
  });

  it("steps by one on the arrow keys", () => {
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp" }));
    expect(committed.at(-1)).toBeCloseTo(START_VALUE + STEP);
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
    expect(committed.at(-1)).toBeCloseTo(START_VALUE);
  });

  it("takes the wheel only while the field has focus", () => {
    input.dispatchEvent(new WheelEvent("wheel", { deltaY: -1, cancelable: true }));
    expect(committed).toEqual([]);
    input.focus();
    input.dispatchEvent(new WheelEvent("wheel", { deltaY: -1, cancelable: true }));
    expect(committed.at(-1)).toBeCloseTo(START_VALUE + STEP);
  });

  it("ignores buttons other than the primary one", () => {
    input.dispatchEvent(new PointerEvent("pointerdown", { button: 2, clientY: 100, pointerId: 1 }));
    input.dispatchEvent(new PointerEvent("pointermove", { clientY: 40, pointerId: 1 }));
    expect(committed).toEqual([]);
  });
});
