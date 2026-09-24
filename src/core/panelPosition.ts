import { PANEL_SPOT_MAX, PANEL_SPOT_MIN } from "./constants";

export interface Box {
  width: number;
  height: number;
}

export interface Point {
  left: number;
  top: number;
}

export interface PanelSpot {
  x: number;
  y: number;
}

const atLeastNothing = (value: number): number => Math.max(value, 0);

const clamp = (value: number, max: number): number => Math.min(atLeastNothing(value), max);

const share = (value: number, free: number): number =>
  free > 0 ? clamp(value, free) / free : PANEL_SPOT_MIN;

const freeSpace = (panel: Box, viewport: Box): Box => ({
  width: atLeastNothing(viewport.width - panel.width),
  height: atLeastNothing(viewport.height - panel.height),
});

export const clampToBox = (point: Point, panel: Box, viewport: Box): Point => {
  const free = freeSpace(panel, viewport);
  return { left: clamp(point.left, free.width), top: clamp(point.top, free.height) };
};

export const toPanelSpot = (point: Point, panel: Box, viewport: Box): PanelSpot => {
  const free = freeSpace(panel, viewport);
  return { x: share(point.left, free.width), y: share(point.top, free.height) };
};

export const fromPanelSpot = (spot: PanelSpot, panel: Box, viewport: Box): Point => {
  const free = freeSpace(panel, viewport);
  return {
    left: free.width * normalizeSpotValue(spot.x),
    top: free.height * normalizeSpotValue(spot.y),
  };
};

export function normalizeSpotValue(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return PANEL_SPOT_MIN;
  return Math.min(Math.max(value, PANEL_SPOT_MIN), PANEL_SPOT_MAX);
}
