import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { defaultVideoSettings } from "../core";

import { setEnabled } from "./actions";
import { applySpeedMode } from "./speed";
import { NEUTRAL_SPEED, store } from "./store";

const YOUTUBE_SPEED = 2;
const LOOPER_SPEED = 0.5;

describe("setEnabled", () => {
  beforeEach(() => {
    store.videoId = null;
    store.settings = { ...defaultVideoSettings(), enabled: true, constEnabled: true };
    store.settings.constSpeed = LOOPER_SPEED;
    store.externalSpeed = YOUTUBE_SPEED;
    store.appliedSpeed = null;
    store.video = { playbackRate: YOUTUBE_SPEED } as HTMLVideoElement;
    applySpeedMode();
  });

  afterEach(() => {
    store.video = null;
    store.externalSpeed = NEUTRAL_SPEED;
  });

  it("hands the rate back to YouTube when switched off", () => {
    expect(store.video?.playbackRate).toBe(LOOPER_SPEED);
    setEnabled(false);
    expect(store.video?.playbackRate).toBe(YOUTUBE_SPEED);
  });

  it("takes the rate over again when switched back on", () => {
    setEnabled(false);
    setEnabled(true);
    expect(store.video?.playbackRate).toBe(LOOPER_SPEED);
  });
});
