import { describe, expect, it } from "vitest";

import { isSameRange, normalizeFragments, withFragment, withoutFragment } from "./fragments";

describe("isSameRange", () => {
  it("treats times within 50 ms as equal", () => {
    expect(isSameRange({ start: 1, end: 2 }, 1.04, 2)).toBe(true);
    expect(isSameRange({ start: 1, end: 2 }, 1.06, 2)).toBe(false);
    expect(isSameRange({ start: 1, end: 2 }, 1, 3)).toBe(false);
  });
});

describe("normalizeFragments", () => {
  it("drops malformed entries, fills ids and sorts by start then end", () => {
    const out = normalizeFragments([
      { id: "b", start: 5, end: 9 },
      { start: 1, end: 3 },
      { start: "x", end: 3 },
      null,
      { id: "a", start: 5, end: 7 },
    ]);
    expect(out.map((f) => [f.start, f.end])).toEqual([
      [1, 3],
      [5, 7],
      [5, 9],
    ]);
    expect(out[0]?.id).toMatch(/^f[0-9a-z]+$/);
    expect(out[1]?.id).toBe("a");
    expect(normalizeFragments([{ start: 1, end: 2 }])[0]?.id).not.toBe(out[0]?.id);
  });

  it("returns an empty list for non-arrays", () => {
    expect(normalizeFragments(undefined)).toEqual([]);
    expect(normalizeFragments("nope")).toEqual([]);
  });
});

describe("withFragment", () => {
  it("adds a new range in sorted position", () => {
    const list = normalizeFragments([{ id: "a", start: 10, end: 20 }]);
    const out = withFragment(list, 1, 2);
    expect(out.map((f) => f.start)).toEqual([1, 10]);
  });

  it("does not add a duplicate range", () => {
    const list = normalizeFragments([{ id: "a", start: 10, end: 20 }]);
    expect(withFragment(list, 10.01, 20)).toBe(list);
  });
});

describe("withoutFragment", () => {
  it("removes by id", () => {
    const list = normalizeFragments([
      { id: "a", start: 1, end: 2 },
      { id: "b", start: 3, end: 4 },
    ]);
    expect(withoutFragment(list, "a").map((f) => f.id)).toEqual(["b"]);
  });
});
