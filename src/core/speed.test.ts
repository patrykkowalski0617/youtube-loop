import { describe, expect, it } from "vitest";

import { clampSpeed, isRampAtTarget, nextRampSpeed, sameSpeed } from "./speed";

describe("clampSpeed", () => {
  it("keeps the YouTube range", () => {
    expect(clampSpeed(0.1)).toBe(0.25);
    expect(clampSpeed(3)).toBe(2);
    expect(clampSpeed(1.5)).toBe(1.5);
  });
});

describe("nextRampSpeed", () => {
  it("steps up toward the target without overshooting", () => {
    const ramp = { start: 0.65, target: 1, step: 0.2 };
    expect(nextRampSpeed(0.65, ramp)).toBeCloseTo(0.85);
    expect(nextRampSpeed(0.85, ramp)).toBeCloseTo(1);
    expect(nextRampSpeed(1, ramp)).toBeCloseTo(1);
  });

  it("steps down when the target is below the start", () => {
    const ramp = { start: 1, target: 0.5, step: 0.3 };
    expect(nextRampSpeed(1, ramp)).toBeCloseTo(0.7);
    expect(nextRampSpeed(0.7, ramp)).toBeCloseTo(0.5);
  });

  it("jumps to the target when there is no step or no ramp", () => {
    expect(nextRampSpeed(0.65, { start: 0.65, target: 1, step: 0 })).toBe(1);
    expect(nextRampSpeed(0.65, { start: 1, target: 1, step: 0.1 })).toBe(1);
  });
});

describe("isRampAtTarget", () => {
  it("is true only when a real ramp has reached its target", () => {
    expect(isRampAtTarget(1, { start: 0.65, target: 1, step: 0.05 })).toBe(true);
    expect(isRampAtTarget(0.95, { start: 0.65, target: 1, step: 0.05 })).toBe(false);
    expect(isRampAtTarget(1, { start: 1, target: 1, step: 0.05 })).toBe(false);
  });
});

describe("sameSpeed", () => {
  it("tolerates floating point noise", () => {
    expect(sameSpeed(1, 1.0005)).toBe(true);
    expect(sameSpeed(1, 1.01)).toBe(false);
  });
});
