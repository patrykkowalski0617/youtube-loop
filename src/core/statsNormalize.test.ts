import { describe, expect, it } from "vitest";

import { normalizeStats } from "./statsNormalize";

describe("normalizeStats", () => {
  it("returns empty statistics for anything that is not an object", () => {
    expect(normalizeStats(null).seconds).toBe(0);
    expect(normalizeStats("nope").days).toEqual({});
    expect(normalizeStats(undefined).sessions).toEqual([]);
  });

  it("keeps the numbers it recognises and replaces the rest with zero", () => {
    const stats = normalizeStats({ seconds: 120, reps: "many", bestTempo: Number.NaN });
    expect(stats.seconds).toBe(120);
    expect(stats.reps).toBe(0);
    expect(stats.bestTempo).toBe(0);
  });

  it("fills every field of a stored day and drops empty buckets", () => {
    const stats = normalizeStats({
      days: { "2026-09-26": { seconds: 10, reps: 2, tempos: { "1.00": 2, "0.90": 0 }, hours: {} } },
    });
    const day = stats.days["2026-09-26"];
    expect(day?.seconds).toBe(10);
    expect(day?.idleSeconds).toBe(0);
    expect(day?.tempos).toEqual({ "1.00": 2 });
  });

  it("normalizes sessions and fragment records", () => {
    const stats = normalizeStats({
      sessions: [{ startedAt: 1, endedAt: 2 }],
      fragments: { a: { seconds: 5 } },
    });
    expect(stats.sessions[0]).toEqual({ startedAt: 1, endedAt: 2, seconds: 0, reps: 0 });
    expect(stats.fragments.a).toEqual({ seconds: 5, reps: 0, bestTempo: 0, lastPlayedAt: 0 });
  });

  it("keeps a stored day key out of the way of a broken one", () => {
    expect(normalizeStats({ days: { "2026-09-26": 42 } }).days["2026-09-26"]?.seconds).toBe(0);
  });
});
