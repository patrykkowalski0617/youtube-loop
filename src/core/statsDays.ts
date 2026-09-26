import { CHART_LOCALE, MS_PER_DAY, WEEKDAY_LENGTH } from "./constants";
import { emptyDay } from "./statsShape";
import { dayFromKey, dayKey } from "./time";
import { type DayStats, type VideoStats } from "./types";

export interface DayPoint {
  key: string;
  date: Date;
  weekday: string;
  label: string;
  day: DayStats;
  isToday: boolean;
}

export interface Streak {
  current: number;
  longest: number;
}

const weekdayName = (date: Date): string =>
  date.toLocaleDateString(CHART_LOCALE, { weekday: "long" });

const weekdayShort = (date: Date): string => weekdayName(date).slice(0, WEEKDAY_LENGTH);

export const dateLabel = (date: Date): string =>
  date.toLocaleDateString(CHART_LOCALE, { month: "short", day: "numeric" });

export function dayPoints(stats: VideoStats, range: number, now: Date = new Date()): DayPoint[] {
  const points: DayPoint[] = [];
  for (let i = range - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * MS_PER_DAY);
    const key = dayKey(date);
    points.push({
      key,
      date,
      weekday: weekdayShort(date),
      label: dateLabel(date),
      day: stats.days[key] ?? emptyDay(),
      isToday: i === 0,
    });
  }
  return points;
}

const isActive = (day: DayStats | undefined): boolean => (day?.seconds ?? 0) > 0;

function runLength(present: Set<string>, from: Date): number {
  let length = 0;
  for (;;) {
    if (!present.has(dayKey(new Date(from.getTime() - length * MS_PER_DAY)))) return length;
    length += 1;
  }
}

function longestRun(keys: string[]): number {
  let longest = 0;
  let run = 0;
  let previous = "";
  for (const key of [...keys].sort()) {
    const follows =
      previous !== "" && dayKey(new Date(dayFromKey(previous).getTime() + MS_PER_DAY)) === key;
    run = follows ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = key;
  }
  return longest;
}

export function streakDays(stats: VideoStats, now: Date = new Date()): Streak {
  const keys = Object.keys(stats.days).filter((key) => isActive(stats.days[key]));
  if (!keys.length) return { current: 0, longest: 0 };
  const present = new Set(keys);
  const anchor = present.has(dayKey(now)) ? now : new Date(now.getTime() - MS_PER_DAY);
  return { current: runLength(present, anchor), longest: longestRun(keys) };
}

export const activeDayCount = (points: DayPoint[]): number =>
  points.filter((p) => isActive(p.day)).length;

export const sumDays = (points: DayPoint[], pick: (day: DayStats) => number): number =>
  points.reduce((total, p) => total + pick(p.day), 0);

export const maxDays = (points: DayPoint[], pick: (day: DayStats) => number): number =>
  points.reduce((best, p) => Math.max(best, pick(p.day)), 0);
