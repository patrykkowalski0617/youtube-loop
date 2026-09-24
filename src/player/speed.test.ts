import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { defaultVideoSettings } from "../core";

import { adoptVideoSpeed, applySpeedMode, onRateChange, releaseSpeed } from "./speed";
import { NEUTRAL_SPEED, store } from "./store";

const YOUTUBE_SPEED = 2;
const LOOPER_SPEED = 0.5;

const fakeVideo = (rate: number): HTMLVideoElement => ({ playbackRate: rate }) as HTMLVideoElement;

describe("speed handover", () => {
  beforeEach(() => {
    store.settings = { ...defaultVideoSettings(), enabled: true, constEnabled: true };
    store.settings.constSpeed = LOOPER_SPEED;
    store.currentSpeed = LOOPER_SPEED;
    store.externalSpeed = NEUTRAL_SPEED;
    store.appliedSpeed = null;
    store.video = fakeVideo(NEUTRAL_SPEED);
  });

  afterEach(() => {
    store.video = null;
  });

  it("gives the rate back to the one YouTube set once the loop is off", () => {
    store.video = fakeVideo(YOUTUBE_SPEED);
    onRateChange();
    applySpeedMode();
    expect(store.video.playbackRate).toBe(LOOPER_SPEED);

    store.settings.enabled = false;
    releaseSpeed();
    expect(store.video.playbackRate).toBe(YOUTUBE_SPEED);
  });

  it("does not mistake its own rate for one the viewer chose", () => {
    applySpeedMode();
    onRateChange();
    expect(store.externalSpeed).toBe(NEUTRAL_SPEED);
  });

  it("leaves the video alone while the loop is off", () => {
    store.settings.enabled = false;
    store.video = fakeVideo(YOUTUBE_SPEED);
    applySpeedMode();
    expect(store.video.playbackRate).toBe(YOUTUBE_SPEED);
  });

  it("forgets a remembered rate when new media loads at its own rate", () => {
    store.video = fakeVideo(YOUTUBE_SPEED);
    onRateChange();
    applySpeedMode();
    store.video = fakeVideo(NEUTRAL_SPEED);
    adoptVideoSpeed();
    expect(store.externalSpeed).toBe(NEUTRAL_SPEED);
  });

  it("keeps the loop rate when YouTube changes it mid-loop", () => {
    const video = fakeVideo(NEUTRAL_SPEED);
    store.video = video;
    applySpeedMode();
    video.playbackRate = YOUTUBE_SPEED;
    onRateChange();
    expect(video.playbackRate).toBe(LOOPER_SPEED);
    expect(store.externalSpeed).toBe(YOUTUBE_SPEED);
  });
});
