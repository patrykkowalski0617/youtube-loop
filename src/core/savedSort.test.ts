import { describe, expect, it } from "vitest";

import { isSavedSort, type PlayedSummary, sortSavedEntries } from "./savedSort";
import { defaultVideoSettings } from "./settings";
import { type SavedEntry } from "./types";

const entry = (videoId: string, title: string, savedAt: number): SavedEntry => ({
  ...defaultVideoSettings(),
  videoId,
  title,
  savedAt,
});

const ENTRIES = [entry("a", "Beta", 1), entry("b", "Alpha", 3), entry("c", "Gamma", 2)];

const PLAYED: Record<string, PlayedSummary> = {
  a: { seconds: 300, lastPlayedAt: 10 },
  b: { seconds: 100, lastPlayedAt: 30 },
};

const ids = (sort: Parameters<typeof sortSavedEntries>[1]): string[] =>
  sortSavedEntries(ENTRIES, sort, PLAYED).map((e) => e.videoId);

describe("sortSavedEntries", () => {
  it("puts the most recently saved first by default", () => {
    expect(ids("saved")).toEqual(["b", "c", "a"]);
  });

  it("puts the longest played first", () => {
    expect(ids("played")).toEqual(["a", "b", "c"]);
  });

  it("puts the most recently played first", () => {
    expect(ids("lastPlayed")).toEqual(["b", "a", "c"]);
  });

  it("sorts by title when asked", () => {
    expect(ids("title")).toEqual(["b", "a", "c"]);
  });

  it("falls back on the save date when the measure ties", () => {
    expect(sortSavedEntries(ENTRIES, "played", {}).map((e) => e.videoId)).toEqual(["b", "c", "a"]);
  });

  it("leaves the list it was given untouched", () => {
    sortSavedEntries(ENTRIES, "title", PLAYED);
    expect(ENTRIES.map((e) => e.videoId)).toEqual(["a", "b", "c"]);
  });
});

describe("isSavedSort", () => {
  it("accepts a stored order and rejects anything else", () => {
    expect(isSavedSort("lastPlayed")).toBe(true);
    expect(isSavedSort("random")).toBe(false);
  });
});
