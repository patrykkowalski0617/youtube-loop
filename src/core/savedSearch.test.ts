import { describe, expect, it } from "vitest";

import { filterSavedEntries, savedMatches, searchTerms } from "./savedSearch";
import { defaultVideoSettings } from "./settings";
import { type SavedEntry } from "./types";

const entry = (title: string, ...comments: string[]): SavedEntry => ({
  ...defaultVideoSettings(),
  videoId: title,
  title,
  savedAt: 0,
  fragments: comments.map((comment, i) => ({ id: `f${i}`, start: i, end: i + 1, comment })),
});

const SOLO = entry("Republika - Zapytaj mnie", "bend on the b string", "fast run");
const BALLAD = entry("Pink Floyd - Comfortably Numb", "second solo");

const titles = (entries: SavedEntry[]): string[] => entries.map((e) => e.title);

describe("searchTerms", () => {
  it("splits on whitespace and drops the noise", () => {
    expect(searchTerms("  bend   solo ")).toEqual(["bend", "solo"]);
    expect(searchTerms("   ")).toEqual([]);
  });
});

describe("savedMatches", () => {
  it("matches a video by its title", () => {
    expect(savedMatches(SOLO, searchTerms("republika"))).toBe(true);
  });

  it("matches a video by a note on one of its fragments", () => {
    expect(savedMatches(SOLO, searchTerms("b string"))).toBe(true);
  });

  it("ignores case", () => {
    expect(savedMatches(BALLAD, searchTerms("FLOYD"))).toBe(true);
  });

  it("requires every term, but they may come from title and notes alike", () => {
    expect(savedMatches(SOLO, searchTerms("republika bend"))).toBe(true);
    expect(savedMatches(SOLO, searchTerms("republika trumpet"))).toBe(false);
  });

  it("keeps everything when nothing was typed", () => {
    expect(savedMatches(BALLAD, [])).toBe(true);
  });
});

describe("filterSavedEntries", () => {
  const all = [SOLO, BALLAD];

  it("returns the untouched list for an empty query", () => {
    expect(filterSavedEntries(all, "  ")).toBe(all);
  });

  it("keeps only what matches", () => {
    expect(titles(filterSavedEntries(all, "solo"))).toEqual([BALLAD.title]);
    expect(titles(filterSavedEntries(all, "bend"))).toEqual([SOLO.title]);
  });

  it("returns nothing when no video matches", () => {
    expect(filterSavedEntries(all, "harmonica")).toEqual([]);
  });

  it("survives an entry whose fragments predate notes", () => {
    const old = { ...entry("Old take"), fragments: [{ id: "x", start: 0, end: 1 }] } as SavedEntry;
    expect(titles(filterSavedEntries([old], "old"))).toEqual(["Old take"]);
    expect(filterSavedEntries([old], "bend")).toEqual([]);
  });
});

describe("tag filtering", () => {
  const TAGGED = { ...SOLO, tags: ["jazz", "solo"] };
  const UNTAGGED = { ...BALLAD, tags: ["blues"] };
  const ALL = [TAGGED, UNTAGGED];

  it("keeps only entries carrying every selected tag", () => {
    expect(titles(filterSavedEntries(ALL, "", ["JAZZ"]))).toEqual([TAGGED.title]);
    expect(filterSavedEntries(ALL, "", ["jazz", "blues"])).toEqual([]);
  });

  it("combines the tag filter with the text query", () => {
    expect(filterSavedEntries(ALL, "floyd", ["jazz"])).toEqual([]);
    expect(titles(filterSavedEntries(ALL, "republika", ["solo"]))).toEqual([TAGGED.title]);
  });

  it("finds a video by typing its tag", () => {
    expect(titles(filterSavedEntries(ALL, "blues"))).toEqual([UNTAGGED.title]);
  });
});
