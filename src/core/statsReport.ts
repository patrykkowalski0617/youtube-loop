import { CHART_DAYS, MS_PER_DAY, WEEK_DAYS } from "./constants";
import { type Bucket, hourBuckets, tempoBuckets } from "./statsBuckets";
import {
  activeDayCount,
  type DayPoint,
  dayPoints,
  maxDays,
  type Streak,
  streakDays,
  sumDays,
} from "./statsDays";
import { type DayStats, type SessionRecord, type VideoStats } from "./types";

export interface TempoEdges {
  day: string | null;
  first: number;
  last: number;
}

export interface Trend {
  current: number;
  previous: number;
}

export interface StatsReport {
  range: number;
  points: DayPoint[];
  maxDaySeconds: number;
  rangeSeconds: number;
  rangeReps: number;
  rangeAborted: number;
  todaySeconds: number;
  todayReps: number;
  totalSeconds: number;
  totalReps: number;
  partialSeconds: number;
  idleSeconds: number;
  watchSeconds: number;
  activeDays: number;
  streak: Streak;
  completion: number;
  avgSegment: number;
  avgRep: number;
  avgActiveDay: number;
  sessions: number;
  avgSessionSeconds: number;
  longestSessionSeconds: number;
  bestTempoEver: number;
  bestTempoRange: number;
  tempoEdges: TempoEdges;
  targetTempo: number;
  targetReachedAt: string | null;
  tempoToTarget: number;
  tempoBuckets: Bucket[];
  hourBuckets: Bucket[];
  secondsTrend: Trend;
  repsTrend: Trend;
  tempoTrend: Trend;
}

const ratio = (part: number, whole: number): number => (whole > 0 ? part / whole : 0);

function sessionsInRange(stats: VideoStats, range: number, now: Date): SessionRecord[] {
  const from = now.getTime() - range * MS_PER_DAY;
  return stats.sessions.filter((s) => s.endedAt >= from);
}

function tempoEdges(points: DayPoint[]): TempoEdges {
  for (const point of [...points].reverse())
    if (point.day.lastTempo > 0)
      return { day: point.key, first: point.day.firstTempo, last: point.day.lastTempo };
  return { day: null, first: 0, last: 0 };
}

function trends(stats: VideoStats, now: Date) {
  const fortnight = dayPoints(stats, WEEK_DAYS * 2, now);
  const previous = fortnight.slice(0, WEEK_DAYS);
  const current = fortnight.slice(WEEK_DAYS);
  const of = (points: DayPoint[], pick: (day: DayStats) => number): number => sumDays(points, pick);
  return {
    secondsTrend: {
      current: of(current, (d) => d.seconds),
      previous: of(previous, (d) => d.seconds),
    },
    repsTrend: { current: of(current, (d) => d.reps), previous: of(previous, (d) => d.reps) },
    tempoTrend: {
      current: maxDays(current, (d) => d.bestTempo),
      previous: maxDays(previous, (d) => d.bestTempo),
    },
  };
}

export function statsReport(
  stats: VideoStats,
  range: number = CHART_DAYS,
  now: Date = new Date(),
): StatsReport {
  const points = dayPoints(stats, range, now);
  const today = points.at(-1)?.day;
  const sessions = sessionsInRange(stats, range, now);
  const rangeReps = sumDays(points, (d) => d.reps);
  const rangeSeconds = sumDays(points, (d) => d.seconds);
  const rangeAborted = sumDays(points, (d) => d.aborted);
  const activeDays = activeDayCount(points);
  return {
    range,
    points,
    maxDaySeconds: maxDays(points, (d) => d.seconds),
    rangeSeconds,
    rangeReps,
    rangeAborted,
    todaySeconds: today?.seconds ?? 0,
    todayReps: today?.reps ?? 0,
    totalSeconds: stats.seconds,
    totalReps: stats.reps,
    partialSeconds: sumDays(points, (d) => d.partialSeconds),
    idleSeconds: sumDays(points, (d) => d.idleSeconds),
    watchSeconds: sumDays(points, (d) => d.watchSeconds),
    activeDays,
    streak: streakDays(stats, now),
    completion: ratio(rangeReps, rangeReps + rangeAborted),
    avgSegment: ratio(
      sumDays(points, (d) => d.segmentSum),
      rangeReps,
    ),
    avgRep: ratio(rangeSeconds, rangeReps),
    avgActiveDay: ratio(rangeSeconds, activeDays),
    sessions: sessions.length,
    avgSessionSeconds: ratio(
      sessions.reduce((total, s) => total + s.seconds, 0),
      sessions.length,
    ),
    longestSessionSeconds: sessions.reduce((best, s) => Math.max(best, s.seconds), 0),
    bestTempoEver: stats.bestTempo,
    bestTempoRange: maxDays(points, (d) => d.bestTempo),
    tempoEdges: tempoEdges(points),
    targetTempo: stats.targetTempo,
    targetReachedAt: stats.targetReachedAt,
    tempoToTarget: ratio(stats.bestTempo, stats.targetTempo),
    tempoBuckets: tempoBuckets(points),
    hourBuckets: hourBuckets(points),
    ...trends(stats, now),
  };
}
