import { describe, expect, it } from "vitest";

import { MS_PER_MINUTE, SESSION_GAP_MINUTES } from "./constants";
import { mergeStats } from "./statsMerge";
import { emptyDay, emptyStats } from "./statsShape";

const DAY = "2026-09-26";
const AT = new Date("2026-09-26T18:00:00").getTime();

const videoStats = (seconds: number, reps: number, tempo: number, endedAt: number) => ({
  ...emptyStats(),
  seconds,
  reps,
  bestTempo: tempo,
  lastPlayedAt: endedAt,
  firstPlayedAt: endedAt,
  days: { [DAY]: { ...emptyDay(), seconds, reps, bestTempo: tempo, tempos: { "1.00": reps } } },
  sessions: [{ startedAt: endedAt - seconds, endedAt, seconds, reps }],
});

describe("mergeStats", () => {
  it("adds the totals and the day records together", () => {
    const merged = mergeStats([videoStats(60, 2, 0.9, AT), videoStats(30, 1, 1.1, AT)]);
    expect(merged.seconds).toBe(90);
    expect(merged.reps).toBe(3);
    expect(merged.days[DAY]?.seconds).toBe(90);
    expect(merged.days[DAY]?.tempos).toEqual({ "1.00": 3 });
  });

  it("takes the best tempo rather than adding it up", () => {
    expect(mergeStats([videoStats(60, 2, 0.9, AT), videoStats(30, 1, 1.1, AT)]).bestTempo).toBe(
      1.1,
    );
  });

  it("joins sessions that overlap in time and keeps distant ones apart", () => {
    const far = AT + (SESSION_GAP_MINUTES + 5) * MS_PER_MINUTE;
    const merged = mergeStats([videoStats(60, 2, 1, AT), videoStats(30, 1, 1, far)]);
    expect(merged.sessions).toHaveLength(2);
    const together = mergeStats([videoStats(60, 2, 1, AT), videoStats(30, 1, 1, AT + 1000)]);
    expect(together.sessions).toHaveLength(1);
    expect(together.sessions[0]?.reps).toBe(3);
  });

  it("reports no history at all for an empty library", () => {
    const merged = mergeStats([]);
    expect(merged.lastPlayedAt).toBeNull();
    expect(merged.firstPlayedAt).toBeNull();
  });
});
