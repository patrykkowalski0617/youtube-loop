import { describe, expect, it } from "vitest";

import { fragmentRows, matchFragmentId } from "./statsFragments";
import { emptyStats } from "./statsShape";
import { type Fragment } from "./types";

const fragment = (id: string, start: number, end: number, comment = ""): Fragment => ({
  id,
  start,
  end,
  comment,
});

const FRAGMENTS = [fragment("a", 10, 20, "the run"), fragment("b", 30, 40)];

const statsWith = (fragments: Record<string, { seconds: number; lastPlayedAt: number }>) => ({
  ...emptyStats(),
  fragments: Object.fromEntries(
    Object.entries(fragments).map(([id, f]) => [
      id,
      { seconds: f.seconds, reps: 1, bestTempo: 1, lastPlayedAt: f.lastPlayedAt },
    ]),
  ),
});

describe("matchFragmentId", () => {
  it("finds the fragment sitting on the current marks", () => {
    expect(matchFragmentId(FRAGMENTS, 30, 40)).toBe("b");
  });

  it("tolerates the rounding the marks carry", () => {
    expect(matchFragmentId(FRAGMENTS, 10.001, 20.001)).toBe("a");
  });

  it("matches nothing when the marks sit elsewhere or are missing", () => {
    expect(matchFragmentId(FRAGMENTS, 11, 20)).toBeNull();
    expect(matchFragmentId(FRAGMENTS, null, 20)).toBeNull();
  });
});

describe("fragmentRows", () => {
  it("puts the most practised fragment first and scales the shares", () => {
    const rows = fragmentRows(
      FRAGMENTS,
      statsWith({ a: { seconds: 30, lastPlayedAt: 2 }, b: { seconds: 90, lastPlayedAt: 1 } }),
    );
    expect(rows.map((r) => r.id)).toEqual(["b", "a"]);
    expect(rows[0]?.share).toBe(1);
    expect(rows[1]?.share).toBe(1 / 3);
  });

  it("points at the fragment left alone the longest", () => {
    const rows = fragmentRows(
      FRAGMENTS,
      statsWith({ a: { seconds: 30, lastPlayedAt: 2 }, b: { seconds: 90, lastPlayedAt: 1 } }),
    );
    expect(rows.find((r) => r.id === "b")?.neglected).toBe(true);
    expect(rows.find((r) => r.id === "a")?.neglected).toBe(false);
  });

  it("calls nothing neglected while every fragment is equally untouched", () => {
    expect(fragmentRows(FRAGMENTS, emptyStats()).every((r) => !r.neglected)).toBe(true);
  });

  it("has nothing to show without fragments", () => {
    expect(fragmentRows([], emptyStats())).toEqual([]);
  });
});
