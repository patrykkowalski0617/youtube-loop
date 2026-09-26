import { SPEED_EPSILON, TEMPO_DECIMALS } from "./constants";
import { emptyFragmentStats, patchDay, pruneStats, withSession } from "./statsShape";
import { dayKey } from "./time";
import { type DayStats, type VideoStats } from "./types";

export interface RepInput {
  segmentSeconds: number;
  elapsedSeconds: number;
  tempo: number;
  trackTempo: boolean;
  targetTempo: number;
  fragmentId: string | null;
  at: number;
}

export interface SpanInput {
  seconds: number;
  at: number;
}

export const tempoKey = (tempo: number): string => tempo.toFixed(TEMPO_DECIMALS);

const hourKey = (at: number): string => String(new Date(at).getHours());

const bump = (map: Record<string, number>, key: string, by: number): Record<string, number> => ({
  ...map,
  [key]: (map[key] ?? 0) + by,
});

function dayWithRep(day: DayStats, rep: RepInput, tempo: number): DayStats {
  const withRun: DayStats = {
    ...day,
    seconds: day.seconds + rep.elapsedSeconds,
    reps: day.reps + 1,
    segmentSum: day.segmentSum + rep.segmentSeconds,
    hours: bump(day.hours, hourKey(rep.at), rep.elapsedSeconds),
  };
  if (tempo <= 0) return withRun;
  return {
    ...withRun,
    bestTempo: Math.max(day.bestTempo, tempo),
    firstTempo: day.firstTempo > 0 ? day.firstTempo : tempo,
    lastTempo: tempo,
    tempos: bump(day.tempos, tempoKey(tempo), 1),
  };
}

function targetProgress(stats: VideoStats, rep: RepInput, tempo: number): Partial<VideoStats> {
  const targetTempo = rep.targetTempo > 0 ? rep.targetTempo : stats.targetTempo;
  if (stats.targetReachedAt || !(rep.targetTempo > 0) || tempo + SPEED_EPSILON < rep.targetTempo)
    return { targetTempo };
  return { targetTempo, targetReachedAt: dayKey(new Date(rep.at)) };
}

function withFragmentRep(stats: VideoStats, rep: RepInput, tempo: number): VideoStats["fragments"] {
  if (!rep.fragmentId) return stats.fragments;
  const current = stats.fragments[rep.fragmentId] ?? emptyFragmentStats();
  return {
    ...stats.fragments,
    [rep.fragmentId]: {
      seconds: current.seconds + rep.elapsedSeconds,
      reps: current.reps + 1,
      bestTempo: Math.max(current.bestTempo, tempo),
      lastPlayedAt: rep.at,
    },
  };
}

export function recordRep(stats: VideoStats, rep: RepInput): VideoStats {
  if (!(rep.elapsedSeconds > 0)) return stats;
  const tempo = rep.trackTempo && rep.tempo > 0 ? Number(tempoKey(rep.tempo)) : 0;
  const withDay = patchDay(stats, rep.at, (day) => dayWithRep(day, rep, tempo));
  return pruneStats(
    {
      ...withDay,
      seconds: stats.seconds + rep.elapsedSeconds,
      reps: stats.reps + 1,
      bestTempo: Math.max(stats.bestTempo, tempo),
      firstPlayedAt: stats.firstPlayedAt ?? rep.at,
      lastPlayedAt: rep.at,
      sessions: withSession(stats.sessions, rep.at, rep.elapsedSeconds, 1),
      fragments: withFragmentRep(stats, rep, tempo),
      ...targetProgress(stats, rep, tempo),
    },
    rep.at,
  );
}

const spanned = (
  stats: VideoStats,
  span: SpanInput,
  patch: (day: DayStats) => DayStats,
): VideoStats => pruneStats(patchDay(stats, span.at, patch), span.at);

export function recordAbandoned(stats: VideoStats, span: SpanInput): VideoStats {
  if (!(span.seconds > 0)) return stats;
  return spanned(stats, span, (day) => ({
    ...day,
    partialSeconds: day.partialSeconds + span.seconds,
    aborted: day.aborted + 1,
  }));
}

export function recordIdle(stats: VideoStats, span: SpanInput): VideoStats {
  if (!(span.seconds > 0)) return stats;
  return spanned(stats, span, (day) => ({ ...day, idleSeconds: day.idleSeconds + span.seconds }));
}

export function recordWatch(stats: VideoStats, span: SpanInput): VideoStats {
  if (!(span.seconds > 0)) return stats;
  const next = spanned(stats, span, (day) => ({
    ...day,
    watchSeconds: day.watchSeconds + span.seconds,
  }));
  return { ...next, lastPlayedAt: span.at, firstPlayedAt: next.firstPlayedAt ?? span.at };
}
