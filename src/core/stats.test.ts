import { describe, expect, it } from "vitest";

import {
  bestSpeed,
  emptyStats,
  lastDays,
  recordLoopCompletion,
  undoLastSpeedRecord,
} from "./stats";

const NOW = new Date(2026, 8, 21, 12);
const TODAY = "2026-09-21";

describe("bestSpeed", () => {
  it("returns the highest per-day tempo, or 0", () => {
    expect(bestSpeed({ daysBestSpeed: { a: 0.8, b: 1.2, c: 1 } })).toBe(1.2);
    expect(bestSpeed({ daysBestSpeed: {} })).toBe(0);
  });
});

describe("recordLoopCompletion", () => {
  const completion = { segmentSeconds: 10, rate: 2, sustainedRate: 2, trackTempo: true, now: NOW };

  it("adds the real elapsed time to the total and to today", () => {
    const out = recordLoopCompletion(emptyStats(), completion);
    expect(out.seconds).toBe(5);
    expect(out.days[TODAY]).toBe(5);
  });

  it("drops day buckets older than 30 days", () => {
    const stats = {
      ...emptyStats(),
      days: { "2026-08-21": 1, "2026-08-22": 2 },
      daysBestSpeed: { "2026-08-21": 1, "2026-08-22": 1 },
    };
    const out = recordLoopCompletion(stats, completion);
    expect(Object.keys(out.days)).toEqual(["2026-08-22", TODAY]);
    expect(Object.keys(out.daysBestSpeed)).toEqual(["2026-08-22", TODAY]);
  });

  it("ignores an empty segment", () => {
    const stats = emptyStats();
    expect(recordLoopCompletion(stats, { ...completion, segmentSeconds: 0 })).toBe(stats);
  });

  it("records a new day best and pushes an undo record", () => {
    const out = recordLoopCompletion(emptyStats(), { ...completion, sustainedRate: 1.234 });
    expect(out.daysBestSpeed[TODAY]).toBe(1.23);
    expect(out.speedRecords).toEqual([{ day: TODAY, speed: 1.23, prevDayBest: 0 }]);
  });

  it("does not record a slower tempo", () => {
    const first = recordLoopCompletion(emptyStats(), completion);
    const out = recordLoopCompletion(first, { ...completion, sustainedRate: 1.5 });
    expect(out.daysBestSpeed[TODAY]).toBe(2);
    expect(out.speedRecords).toHaveLength(1);
  });

  it("does not track tempo outside the ramp mode", () => {
    const out = recordLoopCompletion(emptyStats(), { ...completion, trackTempo: false });
    expect(out.daysBestSpeed).toEqual({});
    expect(out.speedRecords).toEqual([]);
  });

  it("falls back to the current rate when no sustained rate was seen", () => {
    const out = recordLoopCompletion(emptyStats(), {
      ...completion,
      sustainedRate: Number.POSITIVE_INFINITY,
    });
    expect(out.daysBestSpeed[TODAY]).toBe(2);
  });
});

describe("undoLastSpeedRecord", () => {
  it("restores the previous day best and pops the record", () => {
    const first = recordLoopCompletion(emptyStats(), {
      segmentSeconds: 10,
      rate: 1,
      sustainedRate: 1,
      trackTempo: true,
      now: NOW,
    });
    const second = recordLoopCompletion(first, {
      segmentSeconds: 10,
      rate: 1.5,
      sustainedRate: 1.5,
      trackTempo: true,
      now: NOW,
    });
    const undone = undoLastSpeedRecord(second);
    expect(undone.daysBestSpeed[TODAY]).toBe(1);
    expect(undone.speedRecords).toHaveLength(1);
    const cleared = undoLastSpeedRecord(undone);
    expect(cleared.daysBestSpeed).toEqual({});
    expect(undoLastSpeedRecord(cleared)).toBe(cleared);
  });
});

describe("lastDays", () => {
  it("builds seven days ending today with stats attached", () => {
    const stats = { ...emptyStats(), days: { [TODAY]: 30 }, daysBestSpeed: { "2026-09-19": 1.1 } };
    const days = lastDays(stats, NOW);
    expect(days).toHaveLength(7);
    expect(days[0]?.key).toBe("2026-09-15");
    expect(days[4]?.tempo).toBe(1.1);
    expect(days[6]).toMatchObject({ key: TODAY, seconds: 30, isToday: true });
  });
});
