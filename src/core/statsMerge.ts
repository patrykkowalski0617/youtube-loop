import { emptyDay, emptyStats, withSession } from "./statsShape";
import { type DayStats, type SessionRecord, type VideoStats } from "./types";

const addCounts = (
  a: Record<string, number>,
  b: Record<string, number>,
): Record<string, number> => {
  const out = { ...a };
  for (const [key, value] of Object.entries(b)) out[key] = (out[key] ?? 0) + value;
  return out;
};

function addDays(a: DayStats, b: DayStats): DayStats {
  return {
    seconds: a.seconds + b.seconds,
    partialSeconds: a.partialSeconds + b.partialSeconds,
    idleSeconds: a.idleSeconds + b.idleSeconds,
    watchSeconds: a.watchSeconds + b.watchSeconds,
    reps: a.reps + b.reps,
    aborted: a.aborted + b.aborted,
    segmentSum: a.segmentSum + b.segmentSum,
    bestTempo: Math.max(a.bestTempo, b.bestTempo),
    firstTempo: Math.max(a.firstTempo, b.firstTempo),
    lastTempo: Math.max(a.lastTempo, b.lastTempo),
    tempos: addCounts(a.tempos, b.tempos),
    hours: addCounts(a.hours, b.hours),
  };
}

const coalesce = (sessions: SessionRecord[]): SessionRecord[] =>
  [...sessions]
    .sort((a, b) => a.endedAt - b.endedAt)
    .reduce<SessionRecord[]>((acc, s) => withSession(acc, s.endedAt, s.seconds, s.reps), []);

export function mergeStats(list: VideoStats[]): VideoStats {
  const merged = list.reduce<VideoStats>((acc, stats) => {
    const days = { ...acc.days };
    for (const [key, day] of Object.entries(stats.days))
      days[key] = addDays(days[key] ?? emptyDay(), day);
    return {
      ...acc,
      seconds: acc.seconds + stats.seconds,
      reps: acc.reps + stats.reps,
      bestTempo: Math.max(acc.bestTempo, stats.bestTempo),
      targetTempo: Math.max(acc.targetTempo, stats.targetTempo),
      firstPlayedAt: Math.min(
        acc.firstPlayedAt ?? Number.POSITIVE_INFINITY,
        stats.firstPlayedAt ?? Number.POSITIVE_INFINITY,
      ),
      lastPlayedAt: Math.max(acc.lastPlayedAt ?? 0, stats.lastPlayedAt ?? 0),
      days,
      sessions: [...acc.sessions, ...stats.sessions],
    };
  }, emptyStats());
  return {
    ...merged,
    firstPlayedAt: Number.isFinite(merged.firstPlayedAt ?? Number.POSITIVE_INFINITY)
      ? merged.firstPlayedAt
      : null,
    lastPlayedAt: (merged.lastPlayedAt ?? 0) > 0 ? merged.lastPlayedAt : null,
    sessions: coalesce(merged.sessions),
  };
}
