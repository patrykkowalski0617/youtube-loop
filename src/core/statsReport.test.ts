import { describe, expect, it } from "vitest";

import { MS_PER_DAY, WEEK_DAYS } from "./constants";
import { statsReport } from "./statsReport";
import { emptyDay, emptyStats } from "./statsShape";
import { dayKey } from "./time";
import { type DayStats, type VideoStats } from "./types";

const NOW = new Date("2026-09-26T12:00:00");
const keyAgo = (days: number): string => dayKey(new Date(NOW.getTime() - days * MS_PER_DAY));

const day = (over: Partial<DayStats>): DayStats => ({ ...emptyDay(), ...over });

const stats = (): VideoStats => ({
  ...emptyStats(),
  seconds: 1000,
  reps: 50,
  bestTempo: 1.2,
  targetTempo: 1,
  targetReachedAt: keyAgo(3),
  days: {
    [keyAgo(0)]: day({
      seconds: 60,
      reps: 6,
      segmentSum: 30,
      aborted: 2,
      bestTempo: 1.1,
      firstTempo: 0.9,
      lastTempo: 1.1,
    }),
    [keyAgo(1)]: day({
      seconds: 40,
      reps: 4,
      segmentSum: 20,
      idleSeconds: 5,
      watchSeconds: 7,
      partialSeconds: 3,
    }),
    [keyAgo(9)]: day({ seconds: 100, reps: 10, bestTempo: 0.8 }),
  },
  sessions: [
    { startedAt: 0, endedAt: NOW.getTime() - MS_PER_DAY, seconds: 40, reps: 4 },
    { startedAt: 0, endedAt: NOW.getTime(), seconds: 60, reps: 6 },
    { startedAt: 0, endedAt: NOW.getTime() - 9 * MS_PER_DAY, seconds: 100, reps: 10 },
  ],
});

describe("statsReport", () => {
  it("separates what happened in the range from the all-time totals", () => {
    const report = statsReport(stats(), WEEK_DAYS, NOW);
    expect(report.rangeSeconds).toBe(100);
    expect(report.rangeReps).toBe(10);
    expect(report.totalSeconds).toBe(1000);
    expect(report.totalReps).toBe(50);
    expect(report.todaySeconds).toBe(60);
  });

  it("works out the averages from what the range holds", () => {
    const report = statsReport(stats(), WEEK_DAYS, NOW);
    expect(report.avgRep).toBe(10);
    expect(report.avgSegment).toBe(5);
    expect(report.avgActiveDay).toBe(50);
    expect(report.activeDays).toBe(2);
  });

  it("reads completion as finished against everything started", () => {
    expect(statsReport(stats(), WEEK_DAYS, NOW).completion).toBeCloseTo(10 / 12);
  });

  it("only counts the sessions that ended inside the range", () => {
    const report = statsReport(stats(), WEEK_DAYS, NOW);
    expect(report.sessions).toBe(2);
    expect(report.longestSessionSeconds).toBe(60);
    expect(report.avgSessionSeconds).toBe(50);
  });

  it("keeps the all-time tempo record apart from the best inside the range", () => {
    const report = statsReport(stats(), WEEK_DAYS, NOW);
    expect(report.bestTempoEver).toBe(1.2);
    expect(report.bestTempoRange).toBe(1.1);
    expect(report.tempoToTarget).toBe(1.2);
    expect(report.targetReachedAt).toBe(keyAgo(3));
  });

  it("takes the warm-up and closing tempo from the last day that had one", () => {
    expect(statsReport(stats(), WEEK_DAYS, NOW).tempoEdges).toEqual({
      day: keyAgo(0),
      first: 0.9,
      last: 1.1,
    });
  });

  it("gathers the other kinds of time spent on the video", () => {
    const report = statsReport(stats(), WEEK_DAYS, NOW);
    expect(report.idleSeconds).toBe(5);
    expect(report.watchSeconds).toBe(7);
    expect(report.partialSeconds).toBe(3);
  });

  it("compares this week against the one before it", () => {
    const report = statsReport(stats(), WEEK_DAYS, NOW);
    expect(report.secondsTrend).toEqual({ current: 100, previous: 100 });
    expect(report.repsTrend).toEqual({ current: 10, previous: 10 });
    expect(report.tempoTrend).toEqual({ current: 1.1, previous: 0.8 });
  });

  it("says nothing happened rather than dividing by zero", () => {
    const report = statsReport(emptyStats(), WEEK_DAYS, NOW);
    expect(report.completion).toBe(0);
    expect(report.avgRep).toBe(0);
    expect(report.tempoEdges.day).toBeNull();
  });
});
