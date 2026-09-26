import { isSameRange } from "./fragments";
import { emptyFragmentStats } from "./statsShape";
import { type Fragment, type FragmentStats, type VideoStats } from "./types";

export interface FragmentRow {
  id: string;
  start: number;
  end: number;
  comment: string;
  stats: FragmentStats;
  share: number;
  neglected: boolean;
}

export function matchFragmentId(
  fragments: Fragment[],
  start: number | null,
  end: number | null,
): string | null {
  if (start == null || end == null) return null;
  return fragments.find((f) => isSameRange(f, start, end))?.id ?? null;
}

export function fragmentRows(fragments: Fragment[], stats: VideoStats): FragmentRow[] {
  if (!fragments.length) return [];
  const rows = fragments.map((f) => ({
    id: f.id,
    start: f.start,
    end: f.end,
    comment: f.comment,
    stats: stats.fragments[f.id] ?? emptyFragmentStats(),
  }));
  const max = rows.reduce((best, r) => Math.max(best, r.stats.seconds), 0);
  const oldest = rows.reduce(
    (min, r) => Math.min(min, r.stats.lastPlayedAt),
    Number.POSITIVE_INFINITY,
  );
  const stale = rows.length > 1 && rows.some((r) => r.stats.lastPlayedAt > oldest);
  return rows
    .map((r) => ({
      ...r,
      share: max > 0 ? r.stats.seconds / max : 0,
      neglected: stale && r.stats.lastPlayedAt === oldest,
    }))
    .sort((a, b) => b.stats.seconds - a.stats.seconds || a.start - b.start);
}
