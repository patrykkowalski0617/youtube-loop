import { describe, expect, it } from "vitest";

import {
  countText,
  dayText,
  durationText,
  percentText,
  stampText,
  tempoText,
  timesText,
} from "./statsFormat";

describe("statistics formatting", () => {
  it("writes a tempo to two decimals and marks it as a multiplier", () => {
    expect(tempoText(0.8)).toBe("0.80");
    expect(timesText(1.25)).toBe("1.25x");
  });

  it("writes a duration as a clock and a dash when there is none", () => {
    expect(durationText(90)).toBe("1:30");
    expect(durationText(0)).toBe("-");
  });

  it("rounds a count and a share to whole numbers", () => {
    expect(countText(3.4)).toBe("3");
    expect(percentText(0.836)).toBe("84%");
  });

  it("writes a dash rather than a bare zero for an empty tempo or share", () => {
    expect(timesText(0)).toBe("-");
    expect(percentText(0)).toBe("-");
  });

  it("writes a day key as a readable date and says when there is none", () => {
    expect(dayText("2026-09-26")).toBe("Sep 26");
    expect(dayText(null)).toBe("Never");
  });

  it("writes a timestamp as a date and says when nothing was stored", () => {
    expect(stampText(new Date("2026-09-26T12:00:00").getTime())).toBe("Sep 26");
    expect(stampText(0)).toBe("Never");
  });
});
