import { describe, expect, it } from "vitest";

import { MS_PER_DAY, MS_PER_MINUTE, SESSION_GAP_MINUTES, STATS_RETENTION_DAYS } from "./constants";
import { emptyDay, emptyStats, patchDay, pruneStats, withSession } from "./statsShape";
import { dayKey } from "./time";

const NOW = new Date("2026-09-26T12:00:00").getTime();
const dayAgo = (days: number): string => dayKey(new Date(NOW - days * MS_PER_DAY));

describe("emptyStats", () => {
  it("starts every counter at zero and every map empty", () => {
    const stats = emptyStats();
    expect(stats.seconds).toBe(0);
    expect(stats.reps).toBe(0);
    expect(stats.lastPlayedAt).toBeNull();
    expect(stats.days).toEqual({});
    expect(stats.sessions).toEqual([]);
    expect(stats.fragments).toEqual({});
  });
});

describe("patchDay", () => {
  it("creates the day under today's key and leaves the others alone", () => {
    const base = { ...emptyStats(), days: { [dayAgo(3)]: { ...emptyDay(), reps: 4 } } };
    const next = patchDay(base, NOW, (day) => ({ ...day, reps: day.reps + 1 }));
    expect(next.days[dayKey(new Date(NOW))]?.reps).toBe(1);
    expect(next.days[dayAgo(3)]?.reps).toBe(4);
  });

  it("builds on the day already stored", () => {
    const key = dayKey(new Date(NOW));
    const base = { ...emptyStats(), days: { [key]: { ...emptyDay(), reps: 2 } } };
    expect(patchDay(base, NOW, (day) => ({ ...day, reps: day.reps + 1 })).days[key]?.reps).toBe(3);
  });
});

describe("pruneStats", () => {
  it("drops days and sessions older than the retention window", () => {
    const old = dayAgo(STATS_RETENTION_DAYS + 1);
    const fresh = dayAgo(1);
    const stats = {
      ...emptyStats(),
      days: { [old]: emptyDay(), [fresh]: emptyDay() },
      sessions: [
        {
          startedAt: 0,
          endedAt: NOW - (STATS_RETENTION_DAYS + 1) * MS_PER_DAY,
          seconds: 1,
          reps: 1,
        },
        { startedAt: 0, endedAt: NOW - MS_PER_DAY, seconds: 1, reps: 1 },
      ],
    };
    const pruned = pruneStats(stats, NOW);
    expect(Object.keys(pruned.days)).toEqual([fresh]);
    expect(pruned.sessions).toHaveLength(1);
  });
});

describe("withSession", () => {
  it("extends the last session when the break is short enough", () => {
    const first = withSession([], NOW, 30, 1);
    const second = withSession(first, NOW + MS_PER_MINUTE, 20, 1);
    expect(second).toHaveLength(1);
    expect(second[0]?.seconds).toBe(50);
    expect(second[0]?.reps).toBe(2);
    expect(second[0]?.startedAt).toBe(first[0]?.startedAt);
  });

  it("opens a new session once the break passes the gap", () => {
    const first = withSession([], NOW, 30, 1);
    const later = NOW + (SESSION_GAP_MINUTES + 1) * MS_PER_MINUTE;
    const second = withSession(first, later, 20, 1);
    expect(second).toHaveLength(2);
    expect(second[1]?.endedAt).toBe(later);
  });
});
