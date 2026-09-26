import {
  MS_PER_MINUTE,
  MS_PER_SECOND,
  PAUSE_MAX_MINUTES,
  PRACTICE_FLUSH_SECONDS,
  PRACTICE_TICK_MAX_SECONDS,
  recordAbandoned,
  recordIdle,
  recordRep,
  recordWatch,
} from "../core";
import { saveVideoStats } from "../storage";

import { notify, store } from "./store";

export interface RepOutcome {
  segmentSeconds: number;
  expectedSeconds: number;
  tempo: number;
  trackTempo: boolean;
  targetTempo: number;
  fragmentId: string | null;
}

let passSeconds = 0;
let watchSeconds = 0;
let idleSeconds = 0;
let lastTickAt: number | null = null;
let pausedAt: number | null = null;

export function resetPractice(): void {
  passSeconds = 0;
  watchSeconds = 0;
  idleSeconds = 0;
  lastTickAt = null;
  pausedAt = null;
}

function persist(): void {
  if (store.videoId) void saveVideoStats(store.videoId, store.stats);
  notify("status");
}

function sinceLastTick(now: number): number {
  const previous = lastTickAt;
  lastTickAt = now;
  if (previous == null) return 0;
  return Math.min(Math.max((now - previous) / MS_PER_SECOND, 0), PRACTICE_TICK_MAX_SECONDS);
}

export function flushPractice(): void {
  const at = Date.now();
  let next = store.stats;
  if (watchSeconds > 0) next = recordWatch(next, { seconds: watchSeconds, at });
  if (idleSeconds > 0) next = recordIdle(next, { seconds: idleSeconds, at });
  watchSeconds = 0;
  idleSeconds = 0;
  if (next === store.stats) return;
  store.stats = next;
  persist();
}

const isTracked = (): boolean => store.stats.seconds > 0 || store.settings.start != null;

export function practiceTick(inPass: boolean): void {
  const delta = sinceLastTick(Date.now());
  if (inPass) passSeconds += delta;
  else if (isTracked()) watchSeconds += delta;
  if (watchSeconds + idleSeconds >= PRACTICE_FLUSH_SECONDS) flushPractice();
}

export function completeRep(outcome: RepOutcome): void {
  const elapsedSeconds = passSeconds > 0 ? passSeconds : outcome.expectedSeconds;
  passSeconds = 0;
  store.statsUndo = store.stats;
  store.stats = recordRep(store.stats, {
    segmentSeconds: outcome.segmentSeconds,
    elapsedSeconds,
    tempo: outcome.tempo,
    trackTempo: outcome.trackTempo,
    targetTempo: outcome.targetTempo,
    fragmentId: outcome.fragmentId,
    at: Date.now(),
  });
  persist();
}

export function abandonPass(): void {
  if (!(passSeconds > 0)) return;
  store.stats = recordAbandoned(store.stats, { seconds: passSeconds, at: Date.now() });
  passSeconds = 0;
  persist();
}

export function addGap(seconds: number): void {
  idleSeconds += seconds;
}

export function markPaused(): void {
  pausedAt = Date.now();
  lastTickAt = null;
}

export function markResumed(): void {
  if (pausedAt == null) return;
  const limit = (PAUSE_MAX_MINUTES * MS_PER_MINUTE) / MS_PER_SECOND;
  const seconds = Math.min((Date.now() - pausedAt) / MS_PER_SECOND, limit);
  pausedAt = null;
  lastTickAt = null;
  if (store.settings.enabled) idleSeconds += seconds;
}

export function endPractice(): void {
  abandonPass();
  flushPractice();
  resetPractice();
}

export function undoLastRep(): void {
  if (!store.statsUndo) return;
  store.stats = store.statsUndo;
  store.statsUndo = null;
  persist();
}
