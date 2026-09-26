import { describe, expect, it } from "vitest";

import { HOURS_PER_DAY, TEMPO_BUCKETS_MAX } from "./constants";
import { hourBuckets, tempoBuckets } from "./statsBuckets";
import { type DayPoint } from "./statsDays";
import { emptyDay } from "./statsShape";

const point = (over: Partial<ReturnType<typeof emptyDay>>): DayPoint => ({
  key: "2026-09-26",
  date: new Date("2026-09-26T12:00:00"),
  weekday: "Sat",
  label: "Sep 26",
  day: { ...emptyDay(), ...over },
  isToday: true,
});

describe("tempoBuckets", () => {
  it("adds the same tempo across days and sorts by value", () => {
    const rows = tempoBuckets([
      point({ tempos: { "1.00": 2, "0.80": 1 } }),
      point({ tempos: { "0.80": 3 } }),
    ]);
    expect(rows.map((r) => r.label)).toEqual(["0.80", "1.00"]);
    expect(rows[0]?.value).toBe(4);
  });

  it("scales every share against the busiest tempo", () => {
    const rows = tempoBuckets([point({ tempos: { "1.00": 4, "0.80": 1 } })]);
    expect(rows.find((r) => r.label === "1.00")?.share).toBe(1);
    expect(rows.find((r) => r.label === "0.80")?.share).toBe(0.25);
  });

  it("keeps at most the fastest few tempos", () => {
    const tempos: Record<string, number> = {};
    for (let i = 0; i < TEMPO_BUCKETS_MAX + 5; i++) tempos[(1 + i / 100).toFixed(2)] = 1;
    expect(tempoBuckets([point({ tempos })])).toHaveLength(TEMPO_BUCKETS_MAX);
  });

  it("returns nothing when no tempo was recorded", () => {
    expect(tempoBuckets([point({})])).toEqual([]);
  });
});

describe("hourBuckets", () => {
  it("covers the whole day and fills the hours that were practised", () => {
    const rows = hourBuckets([point({ hours: { "9": 60, "21": 30 } })]);
    expect(rows).toHaveLength(HOURS_PER_DAY);
    expect(rows[9]?.value).toBe(60);
    expect(rows[9]?.share).toBe(1);
    expect(rows[21]?.share).toBe(0.5);
    expect(rows[0]?.value).toBe(0);
  });

  it("pads the hour label to two digits", () => {
    expect(hourBuckets([point({})])[9]?.label).toBe("09");
  });
});
