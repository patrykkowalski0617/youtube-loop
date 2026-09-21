import { SPEED_EPSILON, SPEED_MAX, SPEED_MIN } from "./constants";

export interface SpeedRamp {
  start: number;
  target: number;
  step: number;
}

export function clampSpeed(v: number): number {
  return Math.min(SPEED_MAX, Math.max(SPEED_MIN, v));
}

export function nextRampSpeed(current: number, ramp: SpeedRamp): number {
  const start = clampSpeed(ramp.start);
  const target = clampSpeed(ramp.target);
  const step = Math.abs(ramp.step) || 0;
  if (step === 0 || target === start) return target;
  const dir = target > start ? 1 : -1;
  const next = current + dir * step;
  return clampSpeed(dir > 0 ? Math.min(next, target) : Math.max(next, target));
}

export function isRampAtTarget(current: number, ramp: SpeedRamp): boolean {
  const start = clampSpeed(ramp.start);
  const target = clampSpeed(ramp.target);
  if (target === start) return false;
  return Math.abs(current - target) < SPEED_EPSILON;
}

export function sameSpeed(a: number, b: number): boolean {
  return Math.abs(a - b) <= SPEED_EPSILON;
}
