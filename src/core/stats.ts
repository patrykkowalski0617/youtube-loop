import {
  CHART_DAYS,
  MS_PER_DAY,
  SPEED_RECORDS_MAX,
  STATS_RETENTION_DAYS,
  TEMPO_DECIMALS,
} from "./constants";
import { dayKey } from "./time";
import { type DayMap, type VideoStats } from "./types";

const TEMPO_SCALE = 10 ** TEMPO_DECIMALS;

export const emptyStats = (): VideoStats => ({
  seconds: 0,
  days: {},
  daysBestSpeed: {},
  speedRecords: [],
});

function retentionCutoff(now: Date = new Date()): string {
  return dayKey(new Date(now.getTime() - STATS_RETENTION_DAYS * MS_PER_DAY));
}

function pruneDays(days: DayMap, cutoff: string): DayMap {
  const out: DayMap = {};
  for (const [k, v] of Object.entries(days)) if (k >= cutoff) out[k] = v;
  return out;
}

export function bestSpeed(stats: Pick<VideoStats, "daysBestSpeed">): number {
  return Object.values(stats.daysBestSpeed).reduce((best, v) => Math.max(best, v), 0);
}

export interface LoopCompletion {
  segmentSeconds: number;
  rate: number;
  sustainedRate: number;
  trackTempo: boolean;
  now?: Date;
}

export function recordLoopCompletion(stats: VideoStats, c: LoopCompletion): VideoStats {
  if (!(c.segmentSeconds > 0)) return stats;
  const now = c.now ?? new Date();
  const today = dayKey(now);
  const cutoff = retentionCutoff(now);
  const rate = c.rate > 0 ? c.rate : 1;
  const elapsed = c.segmentSeconds / rate;
  const next: VideoStats = {
    seconds: stats.seconds + elapsed,
    days: pruneDays({ ...stats.days, [today]: (stats.days[today] ?? 0) + elapsed }, cutoff),
    daysBestSpeed: stats.daysBestSpeed,
    speedRecords: stats.speedRecords,
  };
  if (!c.trackTempo) return next;
  const sustained = Number.isFinite(c.sustainedRate) ? c.sustainedRate : rate;
  const tempo = Math.round(sustained * TEMPO_SCALE) / TEMPO_SCALE;
  const prevDayBest = stats.daysBestSpeed[today] ?? 0;
  if (tempo <= prevDayBest) return next;
  return {
    ...next,
    daysBestSpeed: pruneDays({ ...stats.daysBestSpeed, [today]: tempo }, cutoff),
    speedRecords: [...stats.speedRecords, { day: today, speed: tempo, prevDayBest }]
      .filter((r) => r.day >= cutoff)
      .slice(-SPEED_RECORDS_MAX),
  };
}

export function undoLastSpeedRecord(stats: VideoStats): VideoStats {
  const rec = stats.speedRecords.at(-1);
  if (!rec) return stats;
  const rest = Object.fromEntries(
    Object.entries(stats.daysBestSpeed).filter(([day]) => day !== rec.day),
  );
  const daysBestSpeed = rec.prevDayBest > 0 ? { ...rest, [rec.day]: rec.prevDayBest } : rest;
  return { ...stats, daysBestSpeed, speedRecords: stats.speedRecords.slice(0, -1) };
}

export interface ChartDay {
  date: Date;
  key: string;
  seconds: number;
  tempo: number;
  isToday: boolean;
}

export function lastDays(
  stats: VideoStats,
  now: Date = new Date(),
  count = CHART_DAYS,
): ChartDay[] {
  const days: ChartDay[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * MS_PER_DAY);
    const key = dayKey(date);
    days.push({
      date,
      key,
      seconds: stats.days[key] ?? 0,
      tempo: stats.daysBestSpeed[key] ?? 0,
      isToday: i === 0,
    });
  }
  return days;
}
