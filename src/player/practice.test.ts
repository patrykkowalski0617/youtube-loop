import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  defaultVideoSettings,
  emptyStats,
  MS_PER_SECOND,
  PRACTICE_TICK_MAX_SECONDS,
} from "../core";
import { installChromeMock, uninstallChromeMock } from "../testing/chromeMock";

import {
  abandonPass,
  addGap,
  completeRep,
  flushPractice,
  practiceTick,
  resetPractice,
  undoLastRep,
} from "./practice";
import { store } from "./store";

const VIDEO_ID = "video";
const START = new Date("2026-09-26T10:00:00").getTime();
const TODAY = "2026-09-26";

const outcome = (over = {}) => ({
  segmentSeconds: 8,
  expectedSeconds: 10,
  tempo: 0.8,
  trackTempo: true,
  targetTempo: 1,
  fragmentId: null,
  ...over,
});

const tickFor = (seconds: number, inPass: boolean): void => {
  practiceTick(inPass);
  vi.setSystemTime(Date.now() + seconds * MS_PER_SECOND);
  practiceTick(inPass);
};

describe("practice accounting", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(START);
    installChromeMock();
    resetPractice();
    store.videoId = VIDEO_ID;
    store.stats = emptyStats();
    store.statsUndo = null;
    store.settings = { ...defaultVideoSettings(), start: 0, end: 8 };
  });

  afterEach(() => {
    vi.useRealTimers();
    uninstallChromeMock();
  });

  it("counts the time the video actually played inside the pass", () => {
    tickFor(1, true);
    completeRep(outcome());
    expect(store.stats.seconds).toBe(1);
    expect(store.stats.reps).toBe(1);
  });

  it("falls back on the expected length when no tick was seen", () => {
    completeRep(outcome());
    expect(store.stats.seconds).toBe(10);
  });

  it("refuses to credit a gap longer than one tick can cover", () => {
    tickFor(PRACTICE_TICK_MAX_SECONDS + 30, true);
    completeRep(outcome());
    expect(store.stats.seconds).toBe(PRACTICE_TICK_MAX_SECONDS);
  });

  it("books time outside a pass as watching, not as practice", () => {
    store.stats = { ...emptyStats(), seconds: 5 };
    tickFor(1, false);
    flushPractice();
    expect(store.stats.days[TODAY]?.watchSeconds).toBe(1);
    expect(store.stats.days[TODAY]?.seconds).toBe(0);
  });

  it("ignores watching a video that carries no marks and no history", () => {
    store.settings = defaultVideoSettings();
    tickFor(1, false);
    flushPractice();
    expect(store.stats.days[TODAY]).toBeUndefined();
  });

  it("books an unfinished pass as abandoned and forgets its time", () => {
    tickFor(1, true);
    abandonPass();
    expect(store.stats.days[TODAY]?.aborted).toBe(1);
    expect(store.stats.days[TODAY]?.partialSeconds).toBe(1);
    completeRep(outcome());
    expect(store.stats.seconds).toBe(10);
  });

  it("books the gap between repetitions as idle time", () => {
    addGap(2);
    flushPractice();
    expect(store.stats.days[TODAY]?.idleSeconds).toBe(2);
  });

  it("puts the statistics back as they were before the last repetition", () => {
    completeRep(outcome());
    completeRep(outcome());
    expect(store.stats.reps).toBe(2);
    undoLastRep();
    expect(store.stats.reps).toBe(1);
    expect(store.statsUndo).toBeNull();
  });

  it("has nothing to undo before a repetition is counted", () => {
    const before = store.stats;
    undoLastRep();
    expect(store.stats).toBe(before);
  });

  it("writes the record under the video being watched", () => {
    completeRep(outcome());
    expect(store.stats.days[TODAY]?.reps).toBe(1);
  });
});
