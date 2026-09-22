// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { defaultVideoSettings } from "../core";

import { removeMarkers, updateMarkers } from "./markers";
import { store } from "./store";

const DURATION = 200;
const START = 50;
const END = 150;

const layer = (): HTMLElement | null => document.getElementById("ytloop-markers");
const marker = (cls: string): HTMLElement | null =>
  document.querySelector<HTMLElement>(`#ytloop-markers .${cls}`);

describe("updateMarkers", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div class="ytp-progress-bar"></div>';
    store.settings = { ...defaultVideoSettings(), enabled: true, start: START, end: END };
    store.video = { duration: DURATION } as HTMLVideoElement;
  });

  afterEach(() => {
    removeMarkers();
    store.video = null;
  });

  it("places both markers and the range as a percentage of the duration", () => {
    updateMarkers();
    expect(marker("ytloop-marker-start")?.style.left).toBe("25%");
    expect(marker("ytloop-marker-end")?.style.left).toBe("75%");
    const range = marker("ytloop-range");
    expect(range?.style.left).toBe("25%");
    expect(range?.style.width).toBe("50%");
  });

  it("reuses the layer instead of stacking one per call", () => {
    updateMarkers();
    updateMarkers();
    expect(document.querySelectorAll("#ytloop-markers")).toHaveLength(1);
  });

  it("hides the layer when the loop is off", () => {
    store.settings.enabled = false;
    updateMarkers();
    expect(layer()?.style.display).toBe("none");
  });

  it("hides the range while only one end is set", () => {
    store.settings.end = null;
    updateMarkers();
    expect(marker("ytloop-marker-end")?.style.display).toBe("none");
    expect(marker("ytloop-range")?.style.display).toBe("none");
  });

  it("leaves positions alone for a live stream with no duration", () => {
    store.video = { duration: Number.POSITIVE_INFINITY } as HTMLVideoElement;
    updateMarkers();
    expect(marker("ytloop-marker-start")?.style.left).toBe("");
  });

  it("does nothing without a progress bar", () => {
    document.body.innerHTML = "";
    updateMarkers();
    expect(layer()).toBeNull();
  });
});

describe("removeMarkers", () => {
  it("takes the layer out of the page", () => {
    document.body.innerHTML = '<div class="ytp-progress-bar"></div>';
    store.video = { duration: DURATION } as HTMLVideoElement;
    updateMarkers();
    removeMarkers();
    expect(layer()).toBeNull();
  });
});
