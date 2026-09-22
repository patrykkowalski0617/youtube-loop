import { BURST_MAX_MS, BURST_MIN_MS, BURST_OVERSHOOT, BURST_SPEED_PX_PER_MS } from "./constants";

export interface Size {
  width: number;
  height: number;
}

export interface BurstGeometry {
  reach: number;
  durationMs: number;
}

export function burstGeometry(panel: Size, viewport: Size): BurstGeometry | null {
  if (!(panel.width > 0) || !(panel.height > 0)) return null;
  const reach =
    Math.max(viewport.width / panel.width, viewport.height / panel.height) * BURST_OVERSHOOT;
  const travelPx = (Math.max(panel.width, panel.height) / 2) * (reach - 1);
  const durationMs = Math.round(travelPx / BURST_SPEED_PX_PER_MS);
  return { reach, durationMs: Math.min(BURST_MAX_MS, Math.max(BURST_MIN_MS, durationMs)) };
}
