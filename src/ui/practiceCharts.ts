import {
  type Bucket,
  formatTime,
  type Fragment,
  type FragmentRow,
  fragmentRows,
  type GlobalReport,
  type StatsReport,
  type VideoStats,
} from "../core";
import { t } from "../i18n";

import { barList, type BarRow } from "./bars";
import { countText, durationText, stampText } from "./statsFormat";
import { statSection, tile, tileGrid } from "./statTiles";

const bucketRows = (buckets: Bucket[], format: (value: number) => string): BarRow[] =>
  buckets.map((bucket) => ({
    label: bucket.label,
    value: format(bucket.value),
    share: bucket.share,
  }));

const fragmentRow = (row: FragmentRow): BarRow => ({
  label: row.comment || t.stats.unnamedFragment(formatTime(row.start), formatTime(row.end)),
  value: durationText(row.stats.seconds),
  share: row.share,
  note: row.neglected
    ? t.stats.neglected
    : `${t.stats.repsCount(row.stats.reps)} - ${t.stats.lastPlayed(stampText(row.stats.lastPlayedAt))}`,
  accent: row.neglected,
});

export function tempoSection(report: StatsReport): HTMLElement | null {
  if (!report.tempoBuckets.length) return null;
  return statSection(
    t.stats.tempoHistogram.label,
    barList(bucketRows(report.tempoBuckets, (value) => t.stats.repsShort(Math.round(value)))),
    t.stats.tempoHistogram.hint,
  );
}

export function hoursSection(report: StatsReport): HTMLElement | null {
  const active = report.hourBuckets.filter((bucket) => bucket.value > 0);
  if (!active.length) return null;
  return statSection(
    t.stats.hours.label,
    barList(
      active.map((bucket) => ({
        label: t.stats.hourLabel(bucket.label),
        value: durationText(bucket.value),
        share: bucket.share,
      })),
    ),
    t.stats.hours.hint,
  );
}

export function fragmentSection(fragments: Fragment[], stats: VideoStats): HTMLElement | null {
  const rows = fragmentRows(fragments, stats);
  if (!rows.length) return null;
  return statSection(
    t.stats.fragments.label,
    barList(rows.map(fragmentRow)),
    t.stats.fragments.hint,
  );
}

export function librarySections(global: GlobalReport): HTMLElement[] {
  const sections = [
    statSection(
      t.stats.sectionLibrary,
      tileGrid([
        tile(t.stats.videos, countText(global.videos)),
        tile(t.stats.activeVideos, countText(global.activeVideos)),
      ]),
    ),
  ];
  if (global.top.length)
    sections.push(
      statSection(
        t.stats.topVideos.label,
        barList(
          global.top.map((row) => ({
            label: row.title,
            value: durationText(row.seconds),
            share: row.share,
            note: t.stats.repsCount(row.reps),
          })),
        ),
        t.stats.topVideos.hint,
      ),
    );
  if (global.tags.length)
    sections.push(
      statSection(
        t.stats.tags.label,
        barList(bucketRows(global.tags, durationText)),
        t.stats.tags.hint,
      ),
    );
  return sections;
}
