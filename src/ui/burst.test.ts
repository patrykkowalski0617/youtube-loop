// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { burstGeometry } from "../core";

import { resetBurst, updateBurst } from "./burst";
import { byId } from "./dom";

const PANEL_WIDTH = 320;
const PANEL_HEIGHT = 400;
const VIEWPORT_WIDTH = 1600;
const VIEWPORT_HEIGHT = 900;

const geometry = (): { reach: number; durationMs: number } => {
  const shape = burstGeometry(
    { width: PANEL_WIDTH, height: PANEL_HEIGHT },
    { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT },
  );
  if (!shape) throw new Error("no geometry");
  return shape;
};

const LIFETIME = geometry().durationMs;

let panel: HTMLElement;

const burst = (): HTMLElement | null => panel.querySelector(".ytloop-burst");

function reachTarget(): void {
  updateBurst(panel, false);
  updateBurst(panel, true);
}

describe("target burst", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '<div id="panel"></div>';
    panel = byId(document, "panel");
    panel.getBoundingClientRect = () =>
      ({
        width: PANEL_WIDTH,
        height: PANEL_HEIGHT,
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        right: PANEL_WIDTH,
        bottom: PANEL_HEIGHT,
      }) as DOMRect;
    window.innerWidth = VIEWPORT_WIDTH;
    window.innerHeight = VIEWPORT_HEIGHT;
    resetBurst(panel);
  });

  afterEach(() => {
    resetBurst(panel);
    vi.useRealTimers();
  });

  it("stays quiet on the first look, even if the ramp is already at its target", () => {
    updateBurst(panel, true);
    expect(burst()).toBeNull();
  });

  it("draws exactly one ring, with one animation and no delay", () => {
    reachTarget();
    const ring = burst();
    expect(ring?.children).toHaveLength(0);
    expect(ring?.style.animationDelay).toBe("");
    expect(ring?.style.animationDuration).toBe(`${geometry().durationMs}ms`);
  });

  it("reaches past the viewport edges from the panel it starts in", () => {
    reachTarget();
    expect(burst()?.style.getPropertyValue("--burst-reach")).toBe(String(geometry().reach));
  });

  it("stays away when the panel cannot be measured", () => {
    panel.getBoundingClientRect = () => ({ width: 0, height: 0 }) as DOMRect;
    reachTarget();
    expect(burst()).toBeNull();
  });

  it("fires when the ramp reaches its target", () => {
    reachTarget();
    expect(burst()).not.toBeNull();
  });

  it("fires once, not on every refresh while the target holds", () => {
    reachTarget();
    const fired = burst();
    updateBurst(panel, true);
    updateBurst(panel, true);
    expect(burst()).toBe(fired);
  });

  it("fires again after the ramp drops and climbs back", () => {
    reachTarget();
    const first = burst();
    vi.advanceTimersByTime(LIFETIME);
    reachTarget();
    expect(burst()).not.toBe(first);
    expect(burst()).not.toBeNull();
  });

  it("keeps a single burst when the target is reached again mid-flight", () => {
    reachTarget();
    vi.advanceTimersByTime(LIFETIME / 2);
    reachTarget();
    expect(panel.querySelectorAll(".ytloop-burst")).toHaveLength(1);
  });

  it("clears itself once the last wave has finished", () => {
    reachTarget();
    vi.advanceTimersByTime(LIFETIME - 1);
    expect(burst()).not.toBeNull();
    vi.advanceTimersByTime(1);
    expect(burst()).toBeNull();
  });

  it("does not let an old timer wipe a fresh burst", () => {
    reachTarget();
    vi.advanceTimersByTime(LIFETIME - 1);
    updateBurst(panel, false);
    reachTarget();
    vi.advanceTimersByTime(1);
    expect(burst()).not.toBeNull();
  });

  it("stays away when the viewer asked for less motion", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    reachTarget();
    expect(burst()).toBeNull();
    vi.unstubAllGlobals();
  });
});
