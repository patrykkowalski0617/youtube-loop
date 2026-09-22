export const SCRUB_PIXELS_PER_STEP = 4;
const SCRUB_COARSE_FACTOR = 10;
const SCRUB_FINE_FACTOR = 0.1;
export const SCRUB_DEAD_ZONE_PX = 3;

export interface ScrubModifiers {
  shiftKey: boolean;
  altKey: boolean;
}

export interface ScrubRange {
  min?: number;
  max?: number;
}

export function scrubStep(step: number, modifiers: ScrubModifiers): number {
  if (modifiers.shiftKey) return step * SCRUB_COARSE_FACTOR;
  if (modifiers.altKey) return step * SCRUB_FINE_FACTOR;
  return step;
}

const roundToStepSize = (value: number, step: number): number => {
  const decimals = Math.max(0, Math.ceil(-Math.log10(step)));
  return Number(value.toFixed(decimals));
};

export function scrubValue(
  base: number,
  deltaPx: number,
  step: number,
  modifiers: ScrubModifiers,
  range: ScrubRange = {},
): number {
  const effective = scrubStep(step, modifiers);
  const steps = Math.trunc(deltaPx / SCRUB_PIXELS_PER_STEP);
  const next = roundToStepSize(base + steps * effective, effective);
  const floored = range.min != null ? Math.max(range.min, next) : next;
  return range.max != null ? Math.min(range.max, floored) : floored;
}

export function nudgeValue(
  base: number,
  direction: number,
  step: number,
  modifiers: ScrubModifiers,
  range: ScrubRange = {},
): number {
  return scrubValue(base, direction * SCRUB_PIXELS_PER_STEP, step, modifiers, range);
}
