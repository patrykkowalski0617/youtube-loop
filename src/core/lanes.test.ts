import { describe, expect, it } from "vitest";

import { assignLanes, laneCount } from "./lanes";
import { type Fragment } from "./types";

const frag = (id: string, start: number, end: number): Fragment => ({
  id,
  start,
  end,
  comment: "",
});

const lanes = (list: Fragment[]): Record<string, number> =>
  Object.fromEntries(assignLanes(list).map((p) => [p.fragment.id, p.lane]));

describe("assignLanes", () => {
  it("keeps separate ranges on one lane", () => {
    expect(lanes([frag("a", 0, 10), frag("b", 20, 30)])).toEqual({ a: 0, b: 0 });
  });

  it("lets a range start exactly where the previous one ended", () => {
    expect(lanes([frag("a", 0, 10), frag("b", 10, 20)])).toEqual({ a: 0, b: 0 });
  });

  it("pushes a partial overlap onto the next lane", () => {
    expect(lanes([frag("a", 0, 10), frag("b", 8, 20)])).toEqual({ a: 0, b: 1 });
  });

  it("stacks three ranges that all overlap", () => {
    expect(lanes([frag("a", 0, 30), frag("b", 5, 20), frag("c", 10, 25)])).toEqual({
      a: 0,
      b: 1,
      c: 2,
    });
  });

  it("puts a parent below its subs and keeps the subs together", () => {
    expect(lanes([frag("sub2", 20, 25), frag("parent", 0, 60), frag("sub1", 5, 10)])).toEqual({
      parent: 0,
      sub1: 1,
      sub2: 1,
    });
  });

  it("reuses a freed lane once a range has ended", () => {
    expect(lanes([frag("a", 0, 10), frag("b", 5, 15), frag("c", 20, 30)])).toEqual({
      a: 0,
      b: 1,
      c: 0,
    });
  });

  it("returns the fragments ordered by start", () => {
    const out = assignLanes([frag("late", 30, 40), frag("early", 0, 10)]);
    expect(out.map((p) => p.fragment.id)).toEqual(["early", "late"]);
  });
});

describe("laneCount", () => {
  it("counts the lanes actually used", () => {
    expect(laneCount(assignLanes([frag("a", 0, 10), frag("b", 5, 15)]))).toBe(2);
    expect(laneCount(assignLanes([frag("a", 0, 10)]))).toBe(1);
    expect(laneCount([])).toBe(0);
  });
});
