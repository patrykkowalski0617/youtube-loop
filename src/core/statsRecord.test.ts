import { describe, expect, it } from "vitest";

import { MS_PER_DAY } from "./constants";
import {
  recordAbandoned,
  recordIdle,
  recordRep,
  recordWatch,
  type RepInput,
  tempoKey,
} from "./statsRecord";
import { emptyStats } from "./statsShape";
import { dayKey } from "./time";

const AT = new Date("2026-09-26T14:30:00").getTime();
const TODAY = dayKey(new Date(AT));
const HOUR = "14";

const rep = (over: Partial<RepInput> = {}): RepInput => ({
  segmentSeconds: 8,
  elapsedSeconds: 10,
  tempo: 0.8,
  trackTempo: true,
  targetTempo: 1,
  fragmentId: null,
  at: AT,
  ...over,
});

describe("tempoKey", () => {
  it("rounds a rate to the stored precision", () => {
    expect(tempoKey(0.8049)).toBe("0.80");
  });
});

describe("recordRep", () => {
  it("counts the time, the repetition and the segment on today's record", () => {
    const stats = recordRep(emptyStats(), rep());
    expect(stats.seconds).toBe(10);
    expect(stats.reps).toBe(1);
    expect(stats.days[TODAY]?.segmentSum).toBe(8);
    expect(stats.days[TODAY]?.hours[HOUR]).toBe(10);
    expect(stats.lastPlayedAt).toBe(AT);
    expect(stats.firstPlayedAt).toBe(AT);
  });

  it("ignores a pass that measured no time", () => {
    const stats = emptyStats();
    expect(recordRep(stats, rep({ elapsedSeconds: 0 }))).toBe(stats);
  });

  it("keeps the first and last tempo of the day and counts them by value", () => {
    const first = recordRep(emptyStats(), rep({ tempo: 0.7 }));
    const second = recordRep(first, rep({ tempo: 0.9 }));
    expect(second.days[TODAY]?.firstTempo).toBe(0.7);
    expect(second.days[TODAY]?.lastTempo).toBe(0.9);
    expect(second.days[TODAY]?.bestTempo).toBe(0.9);
    expect(second.days[TODAY]?.tempos).toEqual({ "0.70": 1, "0.90": 1 });
    expect(second.bestTempo).toBe(0.9);
  });

  it("leaves tempo alone when the pass is not tracking it", () => {
    const stats = recordRep(emptyStats(), rep({ trackTempo: false }));
    expect(stats.bestTempo).toBe(0);
    expect(stats.days[TODAY]?.tempos).toEqual({});
    expect(stats.days[TODAY]?.reps).toBe(1);
  });

  it("marks the day the target tempo was first held and keeps it", () => {
    const reached = recordRep(emptyStats(), rep({ tempo: 1 }));
    expect(reached.targetReachedAt).toBe(TODAY);
    const later = recordRep(reached, rep({ tempo: 1.2, at: AT + MS_PER_DAY }));
    expect(later.targetReachedAt).toBe(TODAY);
  });

  it("does not mark the target while the tempo stays below it", () => {
    expect(recordRep(emptyStats(), rep({ tempo: 0.9 })).targetReachedAt).toBeNull();
  });

  it("adds the pass to the fragment it matched", () => {
    const once = recordRep(emptyStats(), rep({ fragmentId: "f1" }));
    const twice = recordRep(once, rep({ fragmentId: "f1" }));
    expect(twice.fragments.f1).toEqual({
      seconds: 20,
      reps: 2,
      bestTempo: 0.8,
      lastPlayedAt: AT,
    });
  });

  it("opens a session for the first repetition", () => {
    expect(recordRep(emptyStats(), rep()).sessions).toHaveLength(1);
  });
});

describe("spans", () => {
  it("counts an abandoned pass as time and as one aborted attempt", () => {
    const stats = recordAbandoned(emptyStats(), { seconds: 4, at: AT });
    expect(stats.days[TODAY]?.partialSeconds).toBe(4);
    expect(stats.days[TODAY]?.aborted).toBe(1);
    expect(stats.seconds).toBe(0);
  });

  it("counts idle time without touching practice time", () => {
    const stats = recordIdle(emptyStats(), { seconds: 6, at: AT });
    expect(stats.days[TODAY]?.idleSeconds).toBe(6);
    expect(stats.days[TODAY]?.seconds).toBe(0);
  });

  it("counts watch time and treats it as having used the video", () => {
    const stats = recordWatch(emptyStats(), { seconds: 30, at: AT });
    expect(stats.days[TODAY]?.watchSeconds).toBe(30);
    expect(stats.lastPlayedAt).toBe(AT);
  });

  it("ignores spans with no time in them", () => {
    const stats = emptyStats();
    expect(recordIdle(stats, { seconds: 0, at: AT })).toBe(stats);
    expect(recordWatch(stats, { seconds: -1, at: AT })).toBe(stats);
  });
});
