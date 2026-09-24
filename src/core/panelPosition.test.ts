import { describe, expect, it } from "vitest";

import { clampToBox, fromPanelSpot, normalizeSpotValue, toPanelSpot } from "./panelPosition";

const PANEL = { width: 300, height: 400 };
const VIEWPORT = { width: 1000, height: 800 };
const NARROW = { width: 500, height: 500 };
const TINY = { width: 200, height: 200 };

describe("clampToBox", () => {
  it("stops the panel at the far edge instead of past it", () => {
    expect(clampToBox({ left: 5000, top: 5000 }, PANEL, VIEWPORT)).toEqual({
      left: 700,
      top: 400,
    });
  });

  it("stops it at the near edge too", () => {
    expect(clampToBox({ left: -80, top: -20 }, PANEL, VIEWPORT)).toEqual({ left: 0, top: 0 });
  });

  it("pins it to the corner when the panel outgrows the viewport", () => {
    expect(clampToBox({ left: 100, top: 100 }, PANEL, TINY)).toEqual({ left: 0, top: 0 });
  });
});

describe("panel spot", () => {
  it("reads a position as its share of the free space", () => {
    expect(toPanelSpot({ left: 350, top: 200 }, PANEL, VIEWPORT)).toEqual({ x: 0.5, y: 0.5 });
  });

  it("keeps a panel parked at the far edge there in a smaller window", () => {
    const spot = toPanelSpot({ left: 700, top: 400 }, PANEL, VIEWPORT);
    expect(spot).toEqual({ x: 1, y: 1 });
    expect(fromPanelSpot(spot, PANEL, NARROW)).toEqual({ left: 200, top: 100 });
  });

  it("brings a far-out position back inside a shrunken window", () => {
    const spot = toPanelSpot({ left: 700, top: 400 }, PANEL, VIEWPORT);
    expect(fromPanelSpot(spot, PANEL, TINY)).toEqual({ left: 0, top: 0 });
  });

  it("falls back to the corner when there is no free space to share", () => {
    expect(toPanelSpot({ left: 40, top: 40 }, PANEL, TINY)).toEqual({ x: 0, y: 0 });
  });

  it("keeps a stored share inside its own bounds", () => {
    expect(normalizeSpotValue(4)).toBe(1);
    expect(normalizeSpotValue(-4)).toBe(0);
    expect(normalizeSpotValue("half")).toBe(0);
  });
});
