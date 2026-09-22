import { describe, expect, it } from "vitest";

import { FRAGMENT_COMMENT_MAX } from "./constants";
import {
  contains,
  isSameRange,
  nestFragments,
  normalizeComment,
  normalizeFragments,
  withFragment,
  withFragmentComment,
  withoutFragment,
} from "./fragments";
import { type Fragment } from "./types";

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
    expect(out.every((f) => f.comment === "")).toBe(true);
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

describe("normalizeComment", () => {
  it("trims whitespace and rejects non-strings", () => {
    expect(normalizeComment("  bend on the b string  ")).toBe("bend on the b string");
    expect(normalizeComment(undefined)).toBe("");
    expect(normalizeComment(42)).toBe("");
  });

  it("caps the length so one note cannot bloat the stored video", () => {
    expect(normalizeComment("x".repeat(FRAGMENT_COMMENT_MAX + 50))).toHaveLength(
      FRAGMENT_COMMENT_MAX,
    );
  });
});

describe("withFragmentComment", () => {
  const list = normalizeFragments([
    { id: "a", start: 1, end: 2 },
    { id: "b", start: 3, end: 4 },
  ]);

  it("writes the note onto the named fragment only", () => {
    const out = withFragmentComment(list, "b", "slide up");
    expect(out.map((f) => f.comment)).toEqual(["", "slide up"]);
  });

  it("normalises what it stores", () => {
    expect(withFragmentComment(list, "a", "  spaced  ")[0]?.comment).toBe("spaced");
  });

  it("clears the note when given an empty string", () => {
    const noted = withFragmentComment(list, "a", "note");
    expect(withFragmentComment(noted, "a", "   ")[0]?.comment).toBe("");
  });

  it("leaves the list alone for an unknown id", () => {
    expect(withFragmentComment(list, "missing", "x")).toEqual(list);
  });
});

const frag = (id: string, start: number, end: number): Fragment => ({
  id,
  start,
  end,
  comment: "",
});

const shape = (nodes: ReturnType<typeof nestFragments>): unknown =>
  nodes.map((n) => ({ id: n.fragment.id, children: shape(n.children) }));

describe("contains", () => {
  it("accepts a strictly shorter range inside another", () => {
    expect(contains(frag("a", 0, 10), frag("b", 2, 5))).toBe(true);
  });

  it("accepts a sub that shares an edge with its parent", () => {
    expect(contains(frag("a", 0, 10), frag("b", 0, 4))).toBe(true);
    expect(contains(frag("a", 0, 10), frag("b", 6, 10))).toBe(true);
  });

  it("rejects an equal or longer range, so nothing contains itself", () => {
    const a = frag("a", 0, 10);
    expect(contains(a, a)).toBe(false);
    expect(contains(a, frag("b", 0, 10))).toBe(false);
    expect(contains(frag("b", 2, 5), a)).toBe(false);
  });

  it("rejects a range that only overlaps", () => {
    expect(contains(frag("a", 0, 10), frag("b", 8, 14))).toBe(false);
  });
});

describe("nestFragments", () => {
  it("keeps separate ranges as siblings", () => {
    expect(shape(nestFragments([frag("a", 0, 5), frag("b", 6, 9)]))).toEqual([
      { id: "a", children: [] },
      { id: "b", children: [] },
    ]);
  });

  it("puts a contained range under the range that holds it", () => {
    expect(shape(nestFragments([frag("sub", 2, 4), frag("parent", 0, 10)]))).toEqual([
      { id: "parent", children: [{ id: "sub", children: [] }] },
    ]);
  });

  it("nests to the nearest container, not the outermost", () => {
    const tree = nestFragments([frag("outer", 0, 20), frag("mid", 0, 10), frag("inner", 2, 4)]);
    expect(shape(tree)).toEqual([
      {
        id: "outer",
        children: [{ id: "mid", children: [{ id: "inner", children: [] }] }],
      },
    ]);
  });

  it("orders subs by their start inside the parent", () => {
    const tree = nestFragments([frag("parent", 0, 20), frag("late", 12, 15), frag("early", 2, 5)]);
    expect(shape(tree)).toEqual([
      {
        id: "parent",
        children: [
          { id: "early", children: [] },
          { id: "late", children: [] },
        ],
      },
    ]);
  });

  it("leaves a merely overlapping range at the top level", () => {
    expect(shape(nestFragments([frag("a", 0, 10), frag("b", 8, 14)]))).toEqual([
      { id: "a", children: [] },
      { id: "b", children: [] },
    ]);
  });

  it("returns nothing for an empty list", () => {
    expect(nestFragments([])).toEqual([]);
  });
});
