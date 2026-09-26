import { describe, expect, it } from "vitest";

import {
  dayFromKey,
  dayKey,
  formatTime,
  formatTimePrecise,
  parseDecimal,
  parseTime,
  roundToStep,
} from "./time";

describe("formatTime", () => {
  it("renders minutes and seconds", () => {
    expect(formatTime(83)).toBe("1:23");
    expect(formatTime(0)).toBe("0:00");
  });

  it("renders hours when needed", () => {
    expect(formatTime(3723)).toBe("1:02:03");
  });

  it("floors fractions and clamps negatives", () => {
    expect(formatTime(59.9)).toBe("0:59");
    expect(formatTime(-5)).toBe("0:00");
  });

  it("renders a placeholder for missing values", () => {
    expect(formatTime(null)).toBe("--:--");
    expect(formatTime(Number.NaN)).toBe("--:--");
  });
});

describe("formatTimePrecise", () => {
  it("renders hundredths of a second", () => {
    expect(formatTimePrecise(83.45)).toBe("1:23.45");
    expect(formatTimePrecise(5.3)).toBe("0:05.30");
  });

  it("renders hours when needed", () => {
    expect(formatTimePrecise(3723.4)).toBe("1:02:03.40");
  });

  it("rounds before splitting, so seconds never reach sixty", () => {
    expect(formatTimePrecise(59.999)).toBe("1:00.00");
    expect(formatTimePrecise(3599.999)).toBe("1:00:00.00");
  });

  it("clamps negatives and renders a placeholder for missing values", () => {
    expect(formatTimePrecise(-5)).toBe("0:00.00");
    expect(formatTimePrecise(null)).toBe("--:--");
    expect(formatTimePrecise(Number.NaN)).toBe("--:--");
  });
});

describe("parseTime", () => {
  it("parses m:ss and h:mm:ss", () => {
    expect(parseTime("1:23")).toBe(83);
    expect(parseTime("1:02:03")).toBe(3723);
  });

  it("parses plain seconds including decimals", () => {
    expect(parseTime("83")).toBe(83);
    expect(parseTime("83.5")).toBe(83.5);
  });

  it("rejects malformed input", () => {
    expect(parseTime("")).toBeNull();
    expect(parseTime("1:")).toBeNull();
    expect(parseTime("abc")).toBeNull();
    expect(parseTime(null)).toBeNull();
  });
});

describe("parseDecimal", () => {
  it("accepts a comma as the decimal separator", () => {
    expect(parseDecimal("0,65")).toBe(0.65);
    expect(parseDecimal("1.5")).toBe(1.5);
  });
});

describe("roundToStep", () => {
  it("rounds to a hundredth of a second by default", () => {
    expect(roundToStep(12.344)).toBeCloseTo(12.34);
    expect(roundToStep(12.345)).toBeCloseTo(12.35);
  });
});

describe("dayKey", () => {
  it("formats a local date as YYYY-MM-DD", () => {
    expect(dayKey(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("dayFromKey", () => {
  it("returns the local midnight the key stands for", () => {
    const date = dayFromKey("2026-01-05");
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(0);
    expect(date.getDate()).toBe(5);
    expect(date.getHours()).toBe(0);
  });

  it("round-trips through dayKey without drifting a day", () => {
    expect(dayKey(dayFromKey("2026-03-29"))).toBe("2026-03-29");
  });
});
