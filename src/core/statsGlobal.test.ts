import { describe, expect, it } from "vitest";

import { WEEK_DAYS } from "./constants";
import { globalReport, type VideoStatsEntry } from "./statsGlobal";
import { emptyDay, emptyStats } from "./statsShape";
import { dayKey } from "./time";

const NOW = new Date("2026-09-26T12:00:00");
const TODAY = dayKey(NOW);

const entry = (
  videoId: string,
  seconds: number,
  reps: number,
  tags: string[],
): VideoStatsEntry => ({
  videoId,
  title: videoId.toUpperCase(),
  tags,
  stats: {
    ...emptyStats(),
    seconds,
    reps,
    days: seconds > 0 ? { [TODAY]: { ...emptyDay(), seconds, reps } } : {},
  },
});

const ENTRIES = [
  entry("a", 60, 6, ["scales"]),
  entry("b", 120, 12, ["scales", "etudes"]),
  entry("c", 0, 0, ["etudes"]),
];

describe("globalReport", () => {
  it("counts the whole library and the part of it that was active", () => {
    const report = globalReport(ENTRIES, WEEK_DAYS, NOW);
    expect(report.videos).toBe(3);
    expect(report.activeVideos).toBe(2);
  });

  it("ranks the videos by time and leaves the untouched ones out", () => {
    const report = globalReport(ENTRIES, WEEK_DAYS, NOW);
    expect(report.top.map((row) => row.videoId)).toEqual(["b", "a"]);
    expect(report.top[0]?.share).toBe(1);
    expect(report.top[1]?.share).toBe(0.5);
    expect(report.top[0]?.reps).toBe(12);
  });

  it("adds every video's time to each tag it carries", () => {
    const tags = globalReport(ENTRIES, WEEK_DAYS, NOW).tags;
    expect(tags.map((bucket) => [bucket.label, bucket.value])).toEqual([
      ["scales", 180],
      ["etudes", 120],
    ]);
  });

  it("reports the library as one merged history", () => {
    expect(globalReport(ENTRIES, WEEK_DAYS, NOW).report.rangeSeconds).toBe(180);
  });

  it("stays empty for a library with nothing in it", () => {
    const report = globalReport([], WEEK_DAYS, NOW);
    expect(report.videos).toBe(0);
    expect(report.top).toEqual([]);
    expect(report.tags).toEqual([]);
  });
});
