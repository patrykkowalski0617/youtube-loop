import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { defaultVideoSettings, emptyStats } from "../core";
import { SAVED_LIST_KEY, videoSettingsKey, videoStatsKey } from "../storage";
import { installChromeMock, uninstallChromeMock } from "../testing/chromeMock";

import { removeSaved, setEnabled } from "./actions";
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

const VIDEO_ID = "video";
const OTHER_VIDEO_ID = "other-video";
const FRAGMENT = { id: "f1", start: 1, end: 2, comment: "" };
const PLAYED_SECONDS = 30;

describe("removeSaved", () => {
  beforeEach(() => {
    installChromeMock({
      [SAVED_LIST_KEY]: [],
      [videoSettingsKey(VIDEO_ID)]: { ...defaultVideoSettings(), fragments: [FRAGMENT] },
      [videoStatsKey(VIDEO_ID)]: { seconds: PLAYED_SECONDS },
    });
    store.videoId = VIDEO_ID;
    store.settings = { ...defaultVideoSettings(), start: 1, end: 2, fragments: [FRAGMENT] };
    store.stats = { ...emptyStats(), seconds: PLAYED_SECONDS };
  });

  afterEach(() => {
    store.videoId = null;
    uninstallChromeMock();
  });

  it("clears what is on screen for the video that was open", async () => {
    await removeSaved(VIDEO_ID);
    expect(store.settings.fragments).toEqual([]);
    expect(store.settings.start).toBeNull();
    expect(store.stats.seconds).toBe(0);
  });

  it("leaves the open video untouched when another one goes", async () => {
    await removeSaved(OTHER_VIDEO_ID);
    expect(store.settings.fragments).toEqual([FRAGMENT]);
    expect(store.stats.seconds).toBe(PLAYED_SECONDS);
  });
});
