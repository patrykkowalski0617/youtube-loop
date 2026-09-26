import { CHART_DAYS, TOP_TAGS_MAX, TOP_VIDEOS_MAX } from "./constants";
import { type Bucket } from "./statsBuckets";
import { dayPoints, sumDays } from "./statsDays";
import { mergeStats } from "./statsMerge";
import { type StatsReport, statsReport } from "./statsReport";
import { type VideoStats } from "./types";

export interface VideoStatsEntry {
  videoId: string;
  title: string;
  tags: string[];
  stats: VideoStats;
}

export interface RankRow {
  videoId: string;
  title: string;
  seconds: number;
  reps: number;
  share: number;
}

export interface GlobalReport {
  report: StatsReport;
  videos: number;
  activeVideos: number;
  top: RankRow[];
  tags: Bucket[];
}

interface Measured {
  entry: VideoStatsEntry;
  seconds: number;
  reps: number;
}

const measure = (entry: VideoStatsEntry, range: number, now: Date): Measured => {
  const points = dayPoints(entry.stats, range, now);
  return {
    entry,
    seconds: sumDays(points, (d) => d.seconds),
    reps: sumDays(points, (d) => d.reps),
  };
};

function ranked(measured: Measured[]): RankRow[] {
  const max = measured.reduce((best, m) => Math.max(best, m.seconds), 0);
  return measured
    .filter((m) => m.seconds > 0)
    .sort((a, b) => b.seconds - a.seconds)
    .slice(0, TOP_VIDEOS_MAX)
    .map((m) => ({
      videoId: m.entry.videoId,
      title: m.entry.title,
      seconds: m.seconds,
      reps: m.reps,
      share: max > 0 ? m.seconds / max : 0,
    }));
}

function tagBuckets(measured: Measured[]): Bucket[] {
  const sums = new Map<string, number>();
  for (const m of measured)
    for (const tag of m.entry.tags) sums.set(tag, (sums.get(tag) ?? 0) + m.seconds);
  const rows = [...sums.entries()]
    .filter(([, value]) => value > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, TOP_TAGS_MAX);
  const max = rows.reduce((best, [, value]) => Math.max(best, value), 0);
  return rows.map(([key, value]) => ({
    key,
    label: key,
    value,
    share: max > 0 ? value / max : 0,
  }));
}

export function globalReport(
  entries: VideoStatsEntry[],
  range: number = CHART_DAYS,
  now: Date = new Date(),
): GlobalReport {
  const measured = entries.map((entry) => measure(entry, range, now));
  return {
    report: statsReport(mergeStats(entries.map((e) => e.stats)), range, now),
    videos: entries.length,
    activeVideos: measured.filter((m) => m.seconds > 0).length,
    top: ranked(measured),
    tags: tagBuckets(measured),
  };
}
