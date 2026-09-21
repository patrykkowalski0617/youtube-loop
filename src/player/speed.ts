import { clampSpeed, isRampAtTarget, nextRampSpeed, sameSpeed } from "../core";

import { currentRamp, notify, speedActive, store } from "./store";

const NEUTRAL_SPEED = 1;

function setVideoRate(rate: number): void {
  if (!store.video) return;
  store.applyingSpeed = true;
  try {
    store.video.playbackRate = rate;
  } catch {}
  store.applyingSpeed = false;
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

export function applySpeedMode(): void {
  if (speedActive()) {
    resetSpeed();
    if (store.settings.enabled) applySpeed();
  } else {
    setVideoRate(NEUTRAL_SPEED);
  }
}

export function restoreSpeedAfterExternalChange(): void {
  if (!store.video || !store.settings.enabled || !speedActive() || store.applyingSpeed) return;
  if (!sameSpeed(store.video.playbackRate, store.currentSpeed)) applySpeed();
}
