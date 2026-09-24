import {
  DEFAULT_CONST_SPEED,
  DEFAULT_SPEED_START,
  DEFAULT_SPEED_STEP,
  DEFAULT_SPEED_TARGET,
  DEFAULT_TAIL_SECONDS,
} from "./constants";
import { normalizeFragments } from "./fragments";
import { normalizeSpotValue } from "./panelPosition";
import { normalizeTagNames } from "./tags";
import { type GlobalSettings, type VideoSettings } from "./types";

export const defaultVideoSettings = (): VideoSettings => ({
  start: null,
  end: null,
  enabled: false,
  constEnabled: false,
  constSpeed: DEFAULT_CONST_SPEED,
  speedEnabled: false,
  speedStart: DEFAULT_SPEED_START,
  speedTarget: DEFAULT_SPEED_TARGET,
  speedStep: DEFAULT_SPEED_STEP,
  fragments: [],
  tags: [],
});

export const defaultGlobalSettings = (): GlobalSettings => ({
  tail: DEFAULT_TAIL_SECONDS,
  panelOpen: false,
  panelX: null,
  panelY: null,
  practiceOpen: false,
});

const numberOr = (v: unknown, fallback: number): number =>
  typeof v === "number" && Number.isFinite(v) ? v : fallback;
const numberOrNull = (v: unknown): number | null => (typeof v === "number" ? v : null);
const spotOrNull = (v: unknown): number | null =>
  typeof v === "number" ? normalizeSpotValue(v) : null;
const booleanOr = (v: unknown, fallback: boolean): boolean =>
  typeof v === "boolean" ? v : fallback;

export function normalizeVideoSettings(raw: unknown): VideoSettings {
  const d = defaultVideoSettings();
  if (typeof raw !== "object" || raw === null) return d;
  const r = raw as Partial<Record<keyof VideoSettings, unknown>>;
  return {
    start: numberOrNull(r.start),
    end: numberOrNull(r.end),
    enabled: booleanOr(r.enabled, d.enabled),
    constEnabled: booleanOr(r.constEnabled, d.constEnabled),
    constSpeed: numberOr(r.constSpeed, d.constSpeed),
    speedEnabled: booleanOr(r.speedEnabled, d.speedEnabled),
    speedStart: numberOr(r.speedStart, d.speedStart),
    speedTarget: numberOr(r.speedTarget, d.speedTarget),
    speedStep: numberOr(r.speedStep, d.speedStep),
    fragments: normalizeFragments(r.fragments),
    tags: normalizeTagNames(r.tags),
  };
}

export function normalizeGlobalSettings(raw: unknown): GlobalSettings {
  const d = defaultGlobalSettings();
  if (typeof raw !== "object" || raw === null) return d;
  const r = raw as Partial<Record<keyof GlobalSettings, unknown>>;
  return {
    tail: numberOr(r.tail, d.tail),
    panelOpen: booleanOr(r.panelOpen, d.panelOpen),
    panelX: spotOrNull(r.panelX),
    panelY: spotOrNull(r.panelY),
    practiceOpen: booleanOr(r.practiceOpen, d.practiceOpen),
  };
}

export function pickVideoSettings(s: VideoSettings): VideoSettings {
  return {
    start: s.start,
    end: s.end,
    enabled: s.enabled,
    constEnabled: s.constEnabled,
    constSpeed: s.constSpeed,
    speedEnabled: s.speedEnabled,
    speedStart: s.speedStart,
    speedTarget: s.speedTarget,
    speedStep: s.speedStep,
    fragments: s.fragments,
    tags: s.tags,
  };
}
