import { type SavedEntry } from "./types";

export const SAVED_SORTS = ["saved", "played", "lastPlayed", "title"] as const;

export type SavedSort = (typeof SAVED_SORTS)[number];

export const DEFAULT_SAVED_SORT: SavedSort = "saved";

export interface PlayedSummary {
  seconds: number;
  lastPlayedAt: number;
}

export const emptyPlayedSummary = (): PlayedSummary => ({ seconds: 0, lastPlayedAt: 0 });

export const isSavedSort = (value: string): value is SavedSort =>
  (SAVED_SORTS as readonly string[]).includes(value);

type Summaries = Record<string, PlayedSummary>;

const summaryOf = (played: Summaries, videoId: string): PlayedSummary =>
  played[videoId] ?? emptyPlayedSummary();

const comparators: Record<SavedSort, (a: SavedEntry, b: SavedEntry, played: Summaries) => number> =
  {
    saved: (a, b) => b.savedAt - a.savedAt,
    played: (a, b, played) =>
      summaryOf(played, b.videoId).seconds - summaryOf(played, a.videoId).seconds,
    lastPlayed: (a, b, played) =>
      summaryOf(played, b.videoId).lastPlayedAt - summaryOf(played, a.videoId).lastPlayedAt,
    title: (a, b) => a.title.localeCompare(b.title),
  };

export function sortSavedEntries(
  entries: SavedEntry[],
  sort: SavedSort,
  played: Summaries,
): SavedEntry[] {
  const compare = comparators[sort];
  return [...entries].sort((a, b) => compare(a, b, played) || b.savedAt - a.savedAt);
}
