import { HOURS_PER_DAY, TEMPO_BUCKETS_MAX } from "./constants";
import { type DayPoint } from "./statsDays";

export interface Bucket {
  key: string;
  label: string;
  value: number;
  share: number;
}

const HOUR_LABEL_PAD = 2;

const withShare = (rows: Omit<Bucket, "share">[]): Bucket[] => {
  const max = rows.reduce((best, r) => Math.max(best, r.value), 0);
  return rows.map((r) => ({ ...r, share: max > 0 ? r.value / max : 0 }));
};

function totals(points: DayPoint[], pick: (day: DayPoint["day"]) => Record<string, number>) {
  const out = new Map<string, number>();
  for (const point of points)
    for (const [key, value] of Object.entries(pick(point.day)))
      out.set(key, (out.get(key) ?? 0) + value);
  return out;
}

export function tempoBuckets(points: DayPoint[]): Bucket[] {
  const sums = totals(points, (day) => day.tempos);
  const rows = [...sums.entries()]
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([key, value]) => ({ key, label: key, value }));
  return withShare(rows.slice(-TEMPO_BUCKETS_MAX));
}

export function hourBuckets(points: DayPoint[]): Bucket[] {
  const sums = totals(points, (day) => day.hours);
  const rows = Array.from({ length: HOURS_PER_DAY }, (_, hour) => ({
    key: String(hour),
    label: String(hour).padStart(HOUR_LABEL_PAD, "0"),
    value: sums.get(String(hour)) ?? 0,
  }));
  return withShare(rows);
}
