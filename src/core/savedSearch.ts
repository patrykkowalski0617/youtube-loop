import { normalizeFragments } from "./fragments";
import { type SavedEntry } from "./types";

const searchableText = (entry: SavedEntry): string =>
  [entry.title, ...normalizeFragments(entry.fragments).map((f) => f.comment)]
    .join(" ")
    .toLowerCase();

export const searchTerms = (query: string): string[] =>
  query.toLowerCase().split(/\s+/u).filter(Boolean);

export function savedMatches(entry: SavedEntry, terms: string[]): boolean {
  if (!terms.length) return true;
  const haystack = searchableText(entry);
  return terms.every((term) => haystack.includes(term));
}

export function filterSavedEntries(entries: SavedEntry[], query: string): SavedEntry[] {
  const terms = searchTerms(query);
  if (!terms.length) return entries;
  return entries.filter((entry) => savedMatches(entry, terms));
}
