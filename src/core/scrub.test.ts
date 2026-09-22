import { describe, expect, it } from "vitest";

import { nudgeValue, SCRUB_PIXELS_PER_STEP, scrubStep, scrubValue } from "./scrub";

const PLAIN = { shiftKey: false, altKey: false };
const SHIFT = { shiftKey: true, altKey: false };
const ALT = { shiftKey: false, altKey: true };
const STEP = 0.05;

describe("scrubStep", () => {
  it("multiplies with shift and divides with alt", () => {
    expect(scrubStep(STEP, PLAIN)).toBeCloseTo(0.05);
    expect(scrubStep(STEP, SHIFT)).toBeCloseTo(0.5);
    expect(scrubStep(STEP, ALT)).toBeCloseTo(0.005);
  });
});

describe("scrubValue", () => {
  it("moves one step per four pixels of drag", () => {
    expect(scrubValue(1, SCRUB_PIXELS_PER_STEP, STEP, PLAIN)).toBeCloseTo(1.05);
    expect(scrubValue(1, SCRUB_PIXELS_PER_STEP * 4, STEP, PLAIN)).toBeCloseTo(1.2);
  });

  it("drags downward to lower the value", () => {
    expect(scrubValue(1, -SCRUB_PIXELS_PER_STEP * 2, STEP, PLAIN)).toBeCloseTo(0.9);
  });

  it("ignores movement smaller than one step", () => {
    expect(scrubValue(1, SCRUB_PIXELS_PER_STEP - 1, STEP, PLAIN)).toBe(1);
  });

  it("rounds to the step size instead of accumulating float noise", () => {
    expect(scrubValue(0.65, SCRUB_PIXELS_PER_STEP * 3, STEP, PLAIN)).toBe(0.8);
    expect(scrubValue(0.1, SCRUB_PIXELS_PER_STEP, 0.2, PLAIN)).toBe(0.3);
  });

  it("respects the range on both ends", () => {
    const range = { min: 0.25, max: 2 };
    expect(scrubValue(1.95, SCRUB_PIXELS_PER_STEP * 10, STEP, PLAIN, range)).toBe(2);
    expect(scrubValue(0.3, -SCRUB_PIXELS_PER_STEP * 10, STEP, PLAIN, range)).toBe(0.25);
  });

  it("applies the modifier to the drag as well", () => {
    expect(scrubValue(1, SCRUB_PIXELS_PER_STEP, STEP, SHIFT)).toBeCloseTo(1.5);
  });
});

describe("nudgeValue", () => {
  it("moves exactly one step per keypress", () => {
    expect(nudgeValue(1, 1, STEP, PLAIN)).toBeCloseTo(1.05);
    expect(nudgeValue(1, -1, STEP, PLAIN)).toBeCloseTo(0.95);
    expect(nudgeValue(1, 1, STEP, SHIFT)).toBeCloseTo(1.5);
  });

  it("stops at the range edge", () => {
    expect(nudgeValue(2, 1, STEP, PLAIN, { max: 2 })).toBe(2);
  });
});
