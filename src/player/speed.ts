import { clampSpeed, isRampAtTarget, nextRampSpeed, sameSpeed } from "../core";

import { currentRamp, NEUTRAL_SPEED, notify, speedActive, store } from "./store";

function isOwnRate(rate: number): boolean {
  return store.appliedSpeed != null && sameSpeed(rate, store.appliedSpeed);
}

function setVideoRate(rate: number): void {
  if (!store.video) return;
  store.appliedSpeed = rate;
  try {
    store.video.playbackRate = rate;
  } catch {}
}

export function resetSpeed(): void {
  const { settings } = store;
  store.currentSpeed = clampSpeed(
    settings.constEnabled ? settings.constSpeed : settings.speedStart,
  );
}

export function applySpeed(): void {
  setVideoRate(store.currentSpeed);
  notify("status");
}

export function stepSpeed(): void {
  store.currentSpeed = nextRampSpeed(store.currentSpeed, currentRamp());
}

export function isAtSpeedTarget(): boolean {
  if (!store.settings.enabled || !store.settings.speedEnabled) return false;
  return isRampAtTarget(store.currentSpeed, currentRamp());
}

export function adoptVideoSpeed(): void {
  const rate = store.video?.playbackRate ?? 0;
  store.externalSpeed = rate > 0 && !isOwnRate(rate) ? rate : NEUTRAL_SPEED;
  store.appliedSpeed = null;
}

export function releaseSpeed(): void {
  setVideoRate(store.externalSpeed);
}

export function applySpeedMode(): void {
  if (!store.settings.enabled) {
    resetSpeed();
    return;
  }
  if (speedActive()) {
    resetSpeed();
    applySpeed();
  } else {
    releaseSpeed();
  }
}

export function onRateChange(): void {
  const { video } = store;
  if (!video || video.playbackRate <= 0 || isOwnRate(video.playbackRate)) return;
  store.externalSpeed = video.playbackRate;
  if (!store.settings.enabled || !speedActive()) return;
  if (!sameSpeed(video.playbackRate, store.currentSpeed)) applySpeed();
}
