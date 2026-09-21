import {
  emptyStats,
  type GlobalSettings,
  normalizeFragments,
  normalizeGlobalSettings,
  normalizeVideoSettings,
  pickVideoSettings,
  type SavedEntry,
  type VideoSettings,
  type VideoStats,
} from "../core";

import { readKey, readKeys, writeKeys } from "./chromeStorage";
import { GLOBAL_SETTINGS_KEY, SAVED_LIST_KEY, videoSettingsKey, videoStatsKey } from "./keys";

export async function loadVideoSettings(videoId: string): Promise<VideoSettings> {
  return normalizeVideoSettings(await readKey(videoSettingsKey(videoId)));
}

export async function saveVideoSettings(videoId: string, s: VideoSettings): Promise<void> {
  await writeKeys({ [videoSettingsKey(videoId)]: pickVideoSettings(s) });
}

export async function loadGlobalSettings(): Promise<GlobalSettings> {
  return normalizeGlobalSettings(await readKey(GLOBAL_SETTINGS_KEY));
}

export async function saveGlobalSettings(g: GlobalSettings): Promise<void> {
  await writeKeys({ [GLOBAL_SETTINGS_KEY]: g });
}

const normalizeStats = (raw: unknown): VideoStats => {
  const d = emptyStats();
  if (typeof raw !== "object" || raw === null) return d;
  const r = raw as Partial<VideoStats>;
  return {
    seconds: typeof r.seconds === "number" ? r.seconds : d.seconds,
    days: r.days ?? d.days,
    daysBestSpeed: r.daysBestSpeed ?? d.daysBestSpeed,
    speedRecords: Array.isArray(r.speedRecords) ? r.speedRecords : d.speedRecords,
  };
};

export async function loadVideoStats(videoId: string): Promise<VideoStats> {
  return normalizeStats(await readKey(videoStatsKey(videoId)));
}

export async function saveVideoStats(videoId: string, stats: VideoStats): Promise<void> {
  await writeKeys({ [videoStatsKey(videoId)]: stats });
}

export async function loadPlayedSeconds(videoIds: string[]): Promise<Record<string, number>> {
  const res = await readKeys(videoIds.map(videoStatsKey));
  const out: Record<string, number> = {};
  for (const id of videoIds) out[id] = normalizeStats(res[videoStatsKey(id)]).seconds;
  return out;
}

export async function loadSavedList(): Promise<SavedEntry[]> {
  const raw = await readKey<unknown>(SAVED_LIST_KEY);
  return Array.isArray(raw) ? (raw as SavedEntry[]) : [];
}

async function saveSavedList(list: SavedEntry[]): Promise<void> {
  await writeKeys({ [SAVED_LIST_KEY]: list });
}

export async function upsertSavedEntry(entry: SavedEntry): Promise<SavedEntry[]> {
  const list = await loadSavedList();
  const i = list.findIndex((e) => e.videoId === entry.videoId);
  if (i >= 0) list[i] = entry;
  else list.unshift(entry);
  await saveSavedList(list);
  return list;
}

export async function removeSavedEntry(videoId: string): Promise<SavedEntry[]> {
  const list = (await loadSavedList()).filter((e) => e.videoId !== videoId);
  await saveSavedList(list);
  return list;
}

export async function mirrorFragmentsToSaved(
  videoId: string,
  fragments: VideoSettings["fragments"],
  createWith: (() => SavedEntry | null) | null,
): Promise<boolean> {
  const list = await loadSavedList();
  const i = list.findIndex((e) => e.videoId === videoId);
  const existing = list[i];
  const created = existing ? null : createWith?.();
  if (existing) list[i] = { ...existing, fragments };
  else if (created) list.unshift(created);
  else return false;
  await saveSavedList(list);
  return true;
}

export async function stageSettingsForNavigation(entry: SavedEntry): Promise<void> {
  const stored = await loadVideoSettings(entry.videoId);
  const fragments = stored.fragments.length
    ? stored.fragments
    : normalizeFragments(entry.fragments);
  await saveVideoSettings(entry.videoId, { ...pickVideoSettings(entry), fragments });
}
