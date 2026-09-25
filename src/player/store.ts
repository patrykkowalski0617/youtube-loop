import {
  defaultGlobalSettings,
  defaultVideoSettings,
  emptyStats,
  type GlobalSettings,
  type Tag,
  type VideoSettings,
  type VideoStats,
} from "../core";

export const NEUTRAL_SPEED = 1;

export type PlayState = "play" | "pause";

export type ChangeKind = "settings" | "status" | "fragments" | "saved" | "playState" | "account";

export type ChangeListener = (kind: ChangeKind) => void;

export interface Store {
  videoId: string | null;
  settings: VideoSettings;
  global: GlobalSettings;
  tags: Tag[];
  stats: VideoStats;
  video: HTMLVideoElement | null;
  currentSpeed: number;
  externalSpeed: number;
  appliedSpeed: number | null;
  inTail: boolean;
  tailTimer: ReturnType<typeof setTimeout> | null;
  desiredPlayState: PlayState | null;
  loopRateMin: number;
}

export const store: Store = {
  videoId: null,
  settings: defaultVideoSettings(),
  global: defaultGlobalSettings(),
  tags: [],
  stats: emptyStats(),
  video: null,
  currentSpeed: NEUTRAL_SPEED,
  externalSpeed: NEUTRAL_SPEED,
  appliedSpeed: null,
  inTail: false,
  tailTimer: null,
  desiredPlayState: null,
  loopRateMin: Number.POSITIVE_INFINITY,
};

const listeners = new Set<ChangeListener>();

export function subscribe(listener: ChangeListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notify(kind: ChangeKind): void {
  for (const l of listeners) l(kind);
}

export const speedActive = (): boolean =>
  store.settings.constEnabled || store.settings.speedEnabled;

export const hasRange = (): boolean => store.settings.start != null && store.settings.end != null;

export const hasFragments = (): boolean => store.settings.fragments.length > 0;

export const currentRamp = () => ({
  start: store.settings.speedStart,
  target: store.settings.speedTarget,
  step: store.settings.speedStep,
});
