import { describe, expect, it } from "vitest";

import {
  defaultGlobalSettings,
  defaultVideoSettings,
  normalizeGlobalSettings,
  normalizeVideoSettings,
  pickVideoSettings,
} from "./settings";

describe("normalizeVideoSettings", () => {
  it("returns defaults for missing or malformed input", () => {
    expect(normalizeVideoSettings(undefined)).toEqual(defaultVideoSettings());
    expect(normalizeVideoSettings("x")).toEqual(defaultVideoSettings());
  });

  it("keeps valid fields and falls back per field", () => {
    const out = normalizeVideoSettings({
      start: 5,
      end: "10",
      enabled: true,
      constSpeed: Number.NaN,
      speedStart: 0.5,
      fragments: [{ start: 1, end: 2 }],
    });
    expect(out.start).toBe(5);
    expect(out.end).toBeNull();
    expect(out.enabled).toBe(true);
    expect(out.constSpeed).toBe(1);
    expect(out.speedStart).toBe(0.5);
    expect(out.fragments).toHaveLength(1);
  });
});

describe("normalizeGlobalSettings", () => {
  it("returns defaults for missing input and keeps valid fields", () => {
    expect(normalizeGlobalSettings(null)).toEqual(defaultGlobalSettings());
    expect(normalizeGlobalSettings({ tail: 2, panelOpen: true, panelLeft: 10 })).toEqual({
      ...defaultGlobalSettings(),
      tail: 2,
      panelOpen: true,
      panelLeft: 10,
    });
  });
});

describe("pickVideoSettings", () => {
  it("drops fields that are not part of the per-video settings", () => {
    const out = pickVideoSettings({ ...defaultVideoSettings(), videoId: "x" } as never);
    expect(out).not.toHaveProperty("videoId");
    expect(out).toEqual(defaultVideoSettings());
  });
});
