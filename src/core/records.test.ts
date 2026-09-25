import { describe, expect, it } from "vitest";

import { withoutKeys } from "./records";

describe("withoutKeys", () => {
  it("drops the named keys and keeps the rest", () => {
    expect(withoutKeys({ a: 1, b: 2, c: 3 }, ["b"])).toEqual({ a: 1, c: 3 });
  });

  it("returns a copy when nothing matches", () => {
    const map = { a: 1 };
    const out = withoutKeys(map, ["b"]);
    expect(out).toEqual(map);
    expect(out).not.toBe(map);
  });
});
