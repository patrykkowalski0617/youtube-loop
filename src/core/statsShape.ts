import {
  MS_PER_DAY,
  MS_PER_MINUTE,
  MS_PER_SECOND,
  SESSION_GAP_MINUTES,
  STATS_RETENTION_DAYS,
} from "./constants";
import { dayKey } from "./time";
import { type DayStats, type FragmentStats, type SessionRecord, type VideoStats } from "./types";

export const emptyDay = (): DayStats => ({
  seconds: 0,
  partialSeconds: 0,
  idleSeconds: 0,
  watchSeconds: 0,
  reps: 0,
  aborted: 0,
  segmentSum: 0,
  bestTempo: 0,
  firstTempo: 0,
  lastTempo: 0,
  tempos: {},
  hours: {},
});

export const emptyFragmentStats = (): FragmentStats => ({
  seconds: 0,
  reps: 0,
  bestTempo: 0,
  lastPlayedAt: 0,
});

export const emptyStats = (): VideoStats => ({
  seconds: 0,
  reps: 0,
  bestTempo: 0,
  targetTempo: 0,
  targetReachedAt: null,
  firstPlayedAt: null,
  lastPlayedAt: null,
  days: {},
  sessions: [],
  fragments: {},
});

const retentionStart = (at: number): number => at - STATS_RETENTION_DAYS * MS_PER_DAY;

export function pruneStats(stats: VideoStats, at: number): VideoStats {
  const from = retentionStart(at);
  const cutoff = dayKey(new Date(from));
  return {
    ...stats,
    days: Object.fromEntries(Object.entries(stats.days).filter(([key]) => key >= cutoff)),
    sessions: stats.sessions.filter((s) => s.endedAt >= from),
  };
}

export function patchDay(
  stats: VideoStats,
  at: number,
  patch: (day: DayStats) => DayStats,
): VideoStats {
  const key = dayKey(new Date(at));
  const day = stats.days[key] ?? emptyDay();
  return { ...stats, days: { ...stats.days, [key]: patch(day) } };
}

const sessionGapMs = (): number => SESSION_GAP_MINUTES * MS_PER_MINUTE;

export function withSession(
  sessions: SessionRecord[],
  at: number,
  seconds: number,
  reps: number,
): SessionRecord[] {
  const last = sessions.at(-1);
  if (last && at - last.endedAt <= sessionGapMs()) {
    const merged: SessionRecord = {
      startedAt: last.startedAt,
      endedAt: at,
      seconds: last.seconds + seconds,
      reps: last.reps + reps,
    };
    return [...sessions.slice(0, -1), merged];
  }
  return [...sessions, { startedAt: at - seconds * MS_PER_SECOND, endedAt: at, seconds, reps }];
}
