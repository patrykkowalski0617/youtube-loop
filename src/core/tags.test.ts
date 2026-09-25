import { describe, expect, it } from "vitest";

import { HUE_CIRCLE } from "./constants";
import {
  findTag,
  hasEveryTag,
  hasTagName,
  keptTagNames,
  keptTags,
  normalizeTagName,
  normalizeTagNames,
  normalizeTags,
  pickTagHue,
  renamedTagNames,
  renamedTags,
  suggestTags,
  withoutTagName,
  withTag,
  withTagName,
} from "./tags";

const MIDDLE = 0.5;
const SPREAD_TAGS = 6;
const MIN_SPREAD_RATIO = 0.7;

const fixedRandom = (value: number) => (): number => value;

const hueDistance = (a: number, b: number): number => {
  const d = Math.abs(a - b) % HUE_CIRCLE;
  return d > HUE_CIRCLE / 2 ? HUE_CIRCLE - d : d;
};

const closestPair = (hues: number[]): number =>
  Math.min(...hues.flatMap((a, i) => hues.slice(i + 1).map((b) => hueDistance(a, b))), HUE_CIRCLE);

describe("tag names", () => {
  it("collapses whitespace and caps the length", () => {
    expect(normalizeTagName("  jazz   guitar  ")).toBe("jazz guitar");
    expect(normalizeTagName("x".repeat(40))).toHaveLength(24);
  });

  it("drops duplicates regardless of case", () => {
    expect(normalizeTagNames(["Jazz", "jazz", 7, " ", "blues"])).toEqual(["Jazz", "blues"]);
  });

  it("adds and removes a name case-insensitively", () => {
    expect(withTagName(["jazz"], "JAZZ")).toEqual(["jazz"]);
    expect(withoutTagName(["jazz", "blues"], "JAZZ")).toEqual(["blues"]);
  });

  it("matches only entries carrying every wanted tag", () => {
    expect(hasEveryTag(["jazz", "blues"], ["JAZZ"])).toBe(true);
    expect(hasEveryTag(["jazz"], ["jazz", "blues"])).toBe(false);
  });
});

describe("tag colours", () => {
  it("keeps the hue a tag was given", () => {
    const tags = withTag([], "jazz", fixedRandom(MIDDLE));
    const again = withTag(tags, "JAZZ", fixedRandom(0));
    expect(again).toBe(tags);
    expect(findTag(again, "jazz")?.hue).toBe(HUE_CIRCLE * MIDDLE);
  });

  it("puts a second hue across the circle from the first", () => {
    const tags = withTag(withTag([], "a", fixedRandom(0)), "b", fixedRandom(MIDDLE));
    expect(hueDistance(tags[0]?.hue ?? 0, tags[1]?.hue ?? 0)).toBe(HUE_CIRCLE / 2);
  });

  it("spreads every new hue into the widest gap", () => {
    let tags = withTag([], "first", fixedRandom(0));
    for (let i = 1; i < SPREAD_TAGS; i++) tags = withTag(tags, `tag${i}`, fixedRandom(MIDDLE));
    expect(closestPair(tags.map((tag) => tag.hue))).toBeGreaterThanOrEqual(
      (HUE_CIRCLE / SPREAD_TAGS) * MIN_SPREAD_RATIO,
    );
  });

  it("stays inside the circle and away from the gap edges", () => {
    const hue = pickTagHue([0], fixedRandom(0));
    expect(hue).toBeGreaterThan(0);
    expect(hue).toBeLessThan(HUE_CIRCLE);
  });

  it("keeps only well-formed stored tags", () => {
    expect(normalizeTags([{ name: "jazz", hue: 400 }, { name: "" }, "nope"])).toEqual([
      { name: "jazz", hue: 40 },
    ]);
  });
});

describe("renaming a tag", () => {
  const JAZZ = withTag([], "jazz", fixedRandom(MIDDLE));

  it("keeps the hue the tag was given", () => {
    const renamed = renamedTags(JAZZ, "JAZZ", "  modal   jazz ");
    expect(renamed).toEqual([{ name: "modal jazz", hue: JAZZ[0]?.hue }]);
  });

  it("refuses a name another tag already holds", () => {
    const two = withTag(JAZZ, "blues", fixedRandom(MIDDLE));
    expect(renamedTags(two, "blues", "JAZZ")).toBe(two);
    expect(renamedTags(two, "blues", "  ")).toBe(two);
  });

  it("leaves untouched lists alone", () => {
    const names = ["blues"];
    expect(renamedTagNames(names, "jazz", "swing")).toBe(names);
    expect(renamedTagNames(["jazz", "blues"], "JAZZ", "swing")).toEqual(["swing", "blues"]);
  });

  it("merges when the new name is already on the video", () => {
    expect(renamedTagNames(["jazz", "swing"], "jazz", "swing")).toEqual(["swing"]);
  });
});

describe("suggestions", () => {
  const TAGS = withTag(withTag([], "pentatonic", fixedRandom(0)), "jazz", fixedRandom(MIDDLE));

  it("matches anywhere in the name and skips tags already on the video", () => {
    expect(suggestTags(TAGS, "ton", []).map((tag) => tag.name)).toEqual(["pentatonic"]);
    expect(suggestTags(TAGS, "", ["JAZZ"]).map((tag) => tag.name)).toEqual(["pentatonic"]);
  });

  it("offers everything left when nothing is typed", () => {
    expect(suggestTags(TAGS, "  ", []).map((tag) => tag.name)).toEqual(["pentatonic", "jazz"]);
  });
});

describe("looking a name up", () => {
  it("ignores case and says no to a name nobody holds", () => {
    expect(hasTagName(["jazz", "blues"], "JAZZ")).toBe(true);
    expect(hasTagName(["jazz"], "swing")).toBe(false);
  });
});

describe("dropping tags nothing uses", () => {
  const TAGS = withTag(withTag([], "jazz", fixedRandom(0)), "blues", fixedRandom(MIDDLE));

  it("keeps only the tags some video still carries", () => {
    expect(keptTags(TAGS, ["BLUES"]).map((tag) => tag.name)).toEqual(["blues"]);
    expect(keptTags(TAGS, [])).toEqual([]);
  });

  it("leaves a fully used catalogue alone", () => {
    expect(keptTags(TAGS, ["blues", "jazz", "swing"])).toBe(TAGS);
  });

  it("drops filter selections whose tag is gone", () => {
    expect(keptTagNames(["jazz", "swing"], TAGS)).toEqual(["jazz"]);
    const names = ["JAZZ"];
    expect(keptTagNames(names, TAGS)).toBe(names);
  });
});
