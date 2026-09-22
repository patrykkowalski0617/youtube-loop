import { describe, expect, it } from "vitest";

import { burstGeometry } from "./burst";
import { BURST_MAX_MS, BURST_MIN_MS, BURST_OVERSHOOT, BURST_SPEED_PX_PER_MS } from "./constants";

const PANEL = { width: 324, height: 400 };
const LAPTOP = { width: 1600, height: 900 };
const WALL = { width: 5120, height: 2880 };
const DESKTOP = { width: 2560, height: 1440 };

const travelOf = (panel: typeof PANEL, reach: number): number =>
  (Math.max(panel.width, panel.height) / 2) * (reach - 1);

describe("burstGeometry", () => {
  it("reaches past the furthest viewport edge", () => {
    const { reach } = burstGeometry(PANEL, LAPTOP) ?? { reach: 0 };
    expect(reach).toBeCloseTo((LAPTOP.width / PANEL.width) * BURST_OVERSHOOT);
    expect(PANEL.width * reach).toBeGreaterThan(LAPTOP.width);
    expect(PANEL.height * reach).toBeGreaterThan(LAPTOP.height);
  });

  it("takes the taller side when the viewport is the narrow one", () => {
    const tall = { width: 600, height: 2000 };
    const { reach } = burstGeometry(PANEL, tall) ?? { reach: 0 };
    expect(reach).toBeCloseTo((tall.height / PANEL.height) * BURST_OVERSHOOT);
  });

  it("holds one speed instead of one duration, so a wall takes longer than a laptop", () => {
    const laptop = burstGeometry(PANEL, LAPTOP);
    const wall = burstGeometry(PANEL, WALL);
    expect(wall?.durationMs).toBeGreaterThan(laptop?.durationMs ?? 0);
  });

  it("derives the duration from the distance the edge travels", () => {
    const geometry = burstGeometry(PANEL, LAPTOP);
    const expected = Math.round(travelOf(PANEL, geometry?.reach ?? 0) / BURST_SPEED_PX_PER_MS);
    expect(geometry?.durationMs).toBe(expected);
  });

  it("keeps the same speed across screen sizes", () => {
    const laptop = burstGeometry(PANEL, LAPTOP);
    const desktop = burstGeometry(PANEL, DESKTOP);
    const speedOf = (g: typeof laptop): number => (g ? travelOf(PANEL, g.reach) / g.durationMs : 0);
    expect(speedOf(desktop)).toBeCloseTo(speedOf(laptop), 1);
    expect(desktop?.durationMs).toBeGreaterThan(laptop?.durationMs ?? 0);
  });

  it("never flickers past or crawls below the sane range", () => {
    const tiny = burstGeometry({ width: 2000, height: 2000 }, { width: 100, height: 100 });
    expect(tiny?.durationMs).toBe(BURST_MIN_MS);
    const huge = burstGeometry({ width: 10, height: 10 }, { width: 8000, height: 8000 });
    expect(huge?.durationMs).toBe(BURST_MAX_MS);
  });

  it("gives nothing for a panel that cannot be measured", () => {
    expect(burstGeometry({ width: 0, height: 400 }, LAPTOP)).toBeNull();
    expect(burstGeometry({ width: 324, height: 0 }, LAPTOP)).toBeNull();
  });
});
