import {
  LOOP_END_TOLERANCE_SECONDS,
  recordLoopCompletion,
  SCRUB_BEFORE_START_TOLERANCE_SECONDS,
} from "../core";
import { saveVideoStats } from "../storage";

import { applySpeed, resetSpeed, stepSpeed } from "./speed";
import { notify, type PlayState, speedActive, store } from "./store";

const ENFORCE_PLAY_STATE_TRIES = 6;
const ENFORCE_PLAY_STATE_INTERVAL_MS = 40;
const MS_PER_SECOND = 1000;

const segmentStart = (): number => store.settings.start ?? 0;

export function resetLoopRate(): void {
  store.loopRateMin = Number.POSITIVE_INFINITY;
}

export function cancelTail(): void {
  if (store.tailTimer) {
    clearTimeout(store.tailTimer);
    store.tailTimer = null;
  }
  store.inTail = false;
}

function playVideo(video: HTMLVideoElement): void {
  video.play().catch(() => undefined);
}

export function seekToStart(): void {
  if (!store.video) return;
  store.video.currentTime = segmentStart();
  resetLoopRate();
}

function restartLoop(): void {
  const { video, settings } = store;
  if (!video) return;
  if (settings.speedEnabled) {
    stepSpeed();
    applySpeed();
  } else if (settings.constEnabled) {
    applySpeed();
  }
  seekToStart();
  if (video.paused) playVideo(video);
}

function enforceDesiredState(): void {
  let tries = 0;
  const enforce = (): void => {
    const { video, desiredPlayState } = store;
    if (!video || desiredPlayState == null) return;
    if (desiredPlayState === "pause" && !video.paused) video.pause();
    if (desiredPlayState === "play" && video.paused) playVideo(video);
    if (++tries < ENFORCE_PLAY_STATE_TRIES) setTimeout(enforce, ENFORCE_PLAY_STATE_INTERVAL_MS);
    else store.desiredPlayState = null;
  };
  enforce();
}

export function toggleLoopPlayback(): void {
  const { video } = store;
  if (!video) return;
  cancelTail();
  const next: PlayState = video.paused ? "play" : "pause";
  store.desiredPlayState = next;
  if (next === "play") {
    resetSpeed();
    if (speedActive()) applySpeed();
    seekToStart();
  }
  enforceDesiredState();
  notify("settings");
}

function completeLoopPass(): void {
  const { video, settings } = store;
  if (settings.start == null || settings.end == null) return;
  const rate = video && video.playbackRate > 0 ? video.playbackRate : 1;
  store.stats = recordLoopCompletion(store.stats, {
    segmentSeconds: settings.end - settings.start,
    rate,
    sustainedRate: store.loopRateMin,
    trackTempo: settings.speedEnabled,
  });
  resetLoopRate();
  if (store.videoId) void saveVideoStats(store.videoId, store.stats);
  notify("status");
}

function startTail(seconds: number): void {
  const { video } = store;
  if (!video) return;
  store.inTail = true;
  video.pause();
  store.tailTimer = setTimeout(() => {
    store.tailTimer = null;
    store.inTail = false;
    if (store.settings.enabled) restartLoop();
  }, seconds * MS_PER_SECOND);
}

export function onTimeUpdate(): void {
  const { video, settings, inTail } = store;
  if (!settings.enabled || !video || inTail) return;
  const { start, end } = settings;
  if (end == null) return;
  if (video.playbackRate > 0) store.loopRateMin = Math.min(store.loopRateMin, video.playbackRate);
  if (video.currentTime >= end - LOOP_END_TOLERANCE_SECONDS) {
    completeLoopPass();
    const tail = store.global.tail > 0 ? store.global.tail : 0;
    if (tail > 0) startTail(tail);
    else restartLoop();
  } else if (start != null && video.currentTime < start - SCRUB_BEFORE_START_TOLERANCE_SECONDS) {
    video.currentTime = start;
  }
}
