import { describe, expect, it } from "vitest";

import { MS_PER_DAY } from "./constants";
import { activeDayCount, dayPoints, maxDays, streakDays, sumDays } from "./statsDays";
import { emptyDay, emptyStats } from "./statsShape";
import { dayKey } from "./time";

const NOW = new Date("2026-09-26T12:00:00");
const keyAgo = (days: number): string => dayKey(new Date(NOW.getTime() - days * MS_PER_DAY));

const withDays = (entries: Record<string, number>) => ({
  ...emptyStats(),
  days: Object.fromEntries(
    Object.entries(entries).map(([key, seconds]) => [key, { ...emptyDay(), seconds, reps: 1 }]),
  ),
});

describe("dayPoints", () => {
  it("returns one point per day, oldest first, ending today", () => {
    const points = dayPoints(withDays({ [keyAgo(1)]: 60 }), 3, NOW);
    expect(points).toHaveLength(3);
    expect(points[0]?.key).toBe(keyAgo(2));
    expect(points[2]?.isToday).toBe(true);
    expect(points[1]?.day.seconds).toBe(60);
  });

  it("gives a day with nothing stored an empty record", () => {
    expect(dayPoints(emptyStats(), 1, NOW)[0]?.day.seconds).toBe(0);
  });

  it("labels the weekday in English whatever the browser locale is", () => {
    expect(dayPoints(emptyStats(), 1, NOW)[0]?.weekday).toBe("Sat");
  });
});

describe("streakDays", () => {
  it("counts back from today while the days hold", () => {
    const stats = withDays({ [keyAgo(0)]: 10, [keyAgo(1)]: 10, [keyAgo(2)]: 10 });
    expect(streakDays(stats, NOW).current).toBe(3);
  });

  it("still counts a streak that ended yesterday", () => {
    expect(streakDays(withDays({ [keyAgo(1)]: 10, [keyAgo(2)]: 10 }), NOW).current).toBe(2);
  });

  it("drops to nothing once a day is missed", () => {
    expect(streakDays(withDays({ [keyAgo(2)]: 10, [keyAgo(3)]: 10 }), NOW).current).toBe(0);
  });

  it("remembers the longest run on record", () => {
    const stats = withDays({
      [keyAgo(10)]: 10,
      [keyAgo(9)]: 10,
      [keyAgo(8)]: 10,
      [keyAgo(1)]: 10,
    });
    expect(streakDays(stats, NOW).longest).toBe(3);
  });

  it("has no streak at all without a practised day", () => {
    expect(streakDays(emptyStats(), NOW)).toEqual({ current: 0, longest: 0 });
  });
});

describe("day arithmetic", () => {
  it("adds up, picks the largest and counts the active days", () => {
    const points = dayPoints(withDays({ [keyAgo(0)]: 30, [keyAgo(1)]: 90 }), 3, NOW);
    expect(sumDays(points, (day) => day.seconds)).toBe(120);
    expect(maxDays(points, (day) => day.seconds)).toBe(90);
    expect(activeDayCount(points)).toBe(2);
  });
});
