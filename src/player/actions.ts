import {
  clampSpeed,
  DEFAULT_CONST_SPEED,
  DEFAULT_SPEED_START,
  DEFAULT_SPEED_STEP,
  DEFAULT_SPEED_TARGET,
  DEFAULT_TAIL_SECONDS,
  emptyStats,
  type Fragment,
  normalizeTagName,
  normalizeVideoSettings,
  type PanelSpot,
  pickVideoSettings,
  renamedTagNames,
  renamedTags,
  roundToStep,
  type SavedEntry,
  type SpeedMode,
  speedModeFlags,
  undoLastSpeedRecord,
  type VideoSettings,
  withFragment,
  withFragmentComment,
  withoutFragment,
  withoutTagName,
  withTag,
  withTagName,
} from "../core";
import { t } from "../i18n";
import {
  loadGlobalSettings,
  loadTags,
  loadVideoSettings,
  loadVideoStats,
  mirrorToSaved,
  removeSavedEntry,
  renameTagEverywhere,
  saveGlobalSettings,
  saveTags,
  saveVideoSettings,
  saveVideoStats,
  stageSettingsForNavigation,
} from "../storage";
import { getVideoTitle, watchUrl } from "../youtube";

import { cancelTail, resetLoopRate, seekToStart } from "./loop";
import { applySpeed, applySpeedMode, releaseSpeed, resetSpeed } from "./speed";
import { notify, speedActive, store } from "./store";

function persistSettings(): void {
  if (store.videoId) void saveVideoSettings(store.videoId, store.settings);
}

function persistGlobal(): void {
  void saveGlobalSettings(store.global);
}

function commit(): void {
  persistSettings();
  notify("settings");
}

function applySpeedIfEnabled(): void {
  resetSpeed();
  if (store.settings.enabled) applySpeed();
}

export function setEnabled(enabled: boolean): void {
  store.settings.enabled = enabled;
  if (!enabled) {
    cancelTail();
    releaseSpeed();
  } else if (speedActive()) applySpeedIfEnabled();
  commit();
}

const currentVideoTime = (): number | null =>
  store.video ? roundToStep(store.video.currentTime) : null;

export function setStartFromVideo(): void {
  const now = currentVideoTime();
  if (now == null) return;
  store.settings.start = now;
  commit();
}

export function setEndFromVideo(): void {
  const now = currentVideoTime();
  if (now == null) return;
  store.settings.end = now;
  commit();
}

export function setStart(value: number | null): void {
  store.settings.start = value;
  commit();
}

export function setEnd(value: number | null): void {
  store.settings.end = value;
  commit();
}

export function setTail(value: number): void {
  store.global.tail = Number.isFinite(value) && value >= 0 ? value : DEFAULT_TAIL_SECONDS;
  persistGlobal();
  notify("settings");
}

export function setSpeedMode(mode: SpeedMode): void {
  Object.assign(store.settings, speedModeFlags(mode));
  persistSettings();
  applySpeedMode();
  notify("settings");
}

export function setConstSpeed(value: number): void {
  store.settings.constSpeed = Number.isFinite(value) ? clampSpeed(value) : DEFAULT_CONST_SPEED;
  if (store.settings.constEnabled) applySpeedIfEnabled();
  commit();
}

export function setSpeedStart(value: number): void {
  store.settings.speedStart = Number.isFinite(value) ? clampSpeed(value) : DEFAULT_SPEED_START;
  if (store.settings.speedEnabled) applySpeedIfEnabled();
  commit();
}

export function setSpeedTarget(value: number): void {
  store.settings.speedTarget = Number.isFinite(value) ? clampSpeed(value) : DEFAULT_SPEED_TARGET;
  commit();
}

export function setSpeedStep(value: number): void {
  store.settings.speedStep = Number.isFinite(value) && value > 0 ? value : DEFAULT_SPEED_STEP;
  commit();
}

export function clearLoop(): void {
  store.settings.start = null;
  store.settings.end = null;
  store.settings.enabled = false;
  cancelTail();
  commit();
}

export function setPanelOpen(open: boolean, persist = true): void {
  store.global.panelOpen = open;
  if (persist) persistGlobal();
}

export function setPracticeOpen(open: boolean): void {
  store.global.practiceOpen = open;
  persistGlobal();
}

export function setPanelSpot(spot: PanelSpot): void {
  store.global.panelX = spot.x;
  store.global.panelY = spot.y;
}

export function persistPanelPosition(): void {
  persistGlobal();
}

export function undoLastRecord(): void {
  store.stats = undoLastSpeedRecord(store.stats);
  if (store.videoId) void saveVideoStats(store.videoId, store.stats);
  notify("status");
}

function currentSnapshot(): SavedEntry | null {
  if (!store.videoId) return null;
  return {
    ...pickVideoSettings(store.settings),
    videoId: store.videoId,
    title: getVideoTitle(store.videoId || t.common.noTitle),
    savedAt: Date.now(),
  };
}

export async function removeSaved(videoId: string): Promise<void> {
  await removeSavedEntry(videoId);
  notify("saved");
}

async function persistToSaved(patch: Partial<SavedEntry>, createSaved: boolean): Promise<void> {
  persistSettings();
  if (!store.videoId) return;
  const changed = await mirrorToSaved(store.videoId, patch, createSaved ? currentSnapshot : null);
  if (changed) notify("saved");
}

const persistFragments = (createSaved: boolean): Promise<void> =>
  persistToSaved({ fragments: store.settings.fragments }, createSaved);

export async function addTag(name: string): Promise<void> {
  const clean = normalizeTagName(name);
  if (!clean) return;
  store.tags = withTag(store.tags, clean);
  store.settings.tags = withTagName(store.settings.tags, clean);
  await saveTags(store.tags);
  await persistToSaved({ tags: store.settings.tags }, true);
  notify("settings");
}

export async function renameTag(name: string, next: string): Promise<void> {
  const clean = normalizeTagName(next);
  const tags = renamedTags(store.tags, name, clean);
  if (tags === store.tags) return;
  store.tags = tags;
  store.settings.tags = renamedTagNames(store.settings.tags, name, clean);
  persistSettings();
  await saveTags(store.tags);
  await renameTagEverywhere(name, clean);
  notify("settings");
  notify("saved");
}

export async function removeTag(name: string): Promise<void> {
  store.settings.tags = withoutTagName(store.settings.tags, name);
  await persistToSaved({ tags: store.settings.tags }, false);
  notify("settings");
}

export function addFragment(): boolean {
  const { start, end } = store.settings;
  if (start == null || end == null) return false;
  store.settings.fragments = withFragment(store.settings.fragments, start, end);
  void persistFragments(true);
  notify("fragments");
  return true;
}

export function removeFragment(id: string): void {
  store.settings.fragments = withoutFragment(store.settings.fragments, id);
  void persistFragments(false);
  notify("fragments");
}

export function setFragmentComment(id: string, comment: string): void {
  store.settings.fragments = withFragmentComment(store.settings.fragments, id, comment);
  void persistFragments(false);
  notify("fragments");
}

export function loadFragment(f: Fragment): void {
  store.settings.start = f.start;
  store.settings.end = f.end;
  cancelTail();
  if (store.video && store.settings.enabled) {
    seekToStart();
    if (speedActive()) {
      resetSpeed();
      applySpeed();
    }
  }
  commit();
}

function applySettings(next: VideoSettings, keepFragmentsIfPresent: boolean): void {
  const fragments =
    keepFragmentsIfPresent && store.settings.fragments.length
      ? store.settings.fragments
      : next.fragments;
  store.settings = { ...next, fragments };
  cancelTail();
  resetSpeed();
  if (store.settings.enabled && speedActive()) applySpeed();
  else releaseSpeed();
}

export async function loadEntry(e: SavedEntry): Promise<boolean> {
  if (e.videoId === store.videoId) {
    applySettings(normalizeVideoSettings(e), true);
    commit();
    return true;
  }
  await stageSettingsForNavigation(e);
  location.href = watchUrl(e.videoId);
  return false;
}

export async function loadForVideo(videoId: string | null): Promise<void> {
  store.videoId = videoId;
  cancelTail();
  resetLoopRate();
  store.settings = normalizeVideoSettings(null);
  store.stats = emptyStats();
  if (!videoId) {
    notify("settings");
    return;
  }
  const [stats, settings] = await Promise.all([
    loadVideoStats(videoId),
    loadVideoSettings(videoId),
  ]);
  if (store.videoId !== videoId) return;
  store.stats = stats;
  applySettings(settings, false);
  notify("settings");
}

export async function loadGlobal(): Promise<void> {
  const [global, tags] = await Promise.all([loadGlobalSettings(), loadTags()]);
  store.global = global;
  store.tags = tags;
  notify("settings");
}
