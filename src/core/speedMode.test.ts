import { describe, expect, it } from "vitest";

import { isSpeedMode, speedModeFlags, speedModeOf } from "./speedMode";

describe("speedModeOf", () => {
  it("reads the mode out of the stored flags", () => {
    expect(speedModeOf({ constEnabled: false, speedEnabled: false })).toBe("off");
    expect(speedModeOf({ constEnabled: true, speedEnabled: false })).toBe("fixed");
    expect(speedModeOf({ constEnabled: false, speedEnabled: true })).toBe("ramp");
  });

  it("prefers the fixed speed when both flags survived from an older version", () => {
    expect(speedModeOf({ constEnabled: true, speedEnabled: true })).toBe("fixed");
  });
});

describe("speedModeFlags", () => {
  it("sets exactly one flag, so the modes cannot both be on", () => {
    expect(speedModeFlags("off")).toEqual({ constEnabled: false, speedEnabled: false });
    expect(speedModeFlags("fixed")).toEqual({ constEnabled: true, speedEnabled: false });
    expect(speedModeFlags("ramp")).toEqual({ constEnabled: false, speedEnabled: true });
  });

  it("round-trips through speedModeOf", () => {
    for (const mode of ["off", "fixed", "ramp"] as const) {
      expect(speedModeOf(speedModeFlags(mode))).toBe(mode);
    }
  });
});

describe("isSpeedMode", () => {
  it("guards values coming out of the DOM", () => {
    expect(isSpeedMode("ramp")).toBe(true);
    expect(isSpeedMode("nonsense")).toBe(false);
  });
});
