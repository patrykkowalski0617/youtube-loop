import {
  normalizeStats,
  normalizeVideoSettings,
  type SavedEntry,
  type VideoSettings,
  type VideoStats,
  withoutKeys,
} from "../core";

import { readAll, readKey, removeKeys, writeKeys } from "./chromeStorage";
import {
  SAVED_LIST_KEY,
  SYNC_META_KEY,
  videoIdFromSettingsKey,
  videoIdFromStatsKey,
  videoSettingsKey,
  videoStatsKey,
} from "./keys";
export interface LocalVideoRecord {
  videoId: string;
  settings: VideoSettings;
  stats: VideoStats;
  saved: SavedEntry | null;
}

export interface SyncMeta {
  videos: Record<string, number>;
  removed: string[];
  lastSyncedAt: number | null;
}

const emptyMeta = (): SyncMeta => ({ videos: {}, removed: [], lastSyncedAt: null });

const removedIds = (raw: unknown): string[] =>
  Array.isArray(raw) ? raw.filter((id): id is string => typeof id === "string") : [];

export async function loadSyncMeta(): Promise<SyncMeta> {
  const raw = await readKey<Partial<SyncMeta>>(SYNC_META_KEY);
  return {
    videos: raw?.videos ?? emptyMeta().videos,
    removed: removedIds(raw?.removed),
    lastSyncedAt: typeof raw?.lastSyncedAt === "number" ? raw.lastSyncedAt : null,
  };
}

export async function saveSyncMeta(meta: SyncMeta): Promise<void> {
  await writeKeys({ [SYNC_META_KEY]: meta });
}

export async function loadAllVideos(): Promise<LocalVideoRecord[]> {
  const all = await readAll();
  const saved = new Map(
    (Array.isArray(all[SAVED_LIST_KEY]) ? (all[SAVED_LIST_KEY] as SavedEntry[]) : []).map((e) => [
      e.videoId,
      e,
    ]),
  );
  const ids = new Set<string>();
  for (const key of Object.keys(all)) {
    const fromSettings = videoIdFromSettingsKey(key);
    if (fromSettings) ids.add(fromSettings);
    const fromStats = videoIdFromStatsKey(key);
    if (fromStats) ids.add(fromStats);
  }
  for (const id of saved.keys()) ids.add(id);
  return [...ids].map((videoId) => ({
    videoId,
    settings: normalizeVideoSettings(all[videoSettingsKey(videoId)]),
    stats: normalizeStats(all[videoStatsKey(videoId)]),
    saved: saved.get(videoId) ?? null,
  }));
}

export async function purgeVideoRecord(videoId: string): Promise<void> {
  await removeKeys([videoSettingsKey(videoId), videoStatsKey(videoId)]);
  const meta = await loadSyncMeta();
  const videos = withoutKeys(meta.videos, [videoId]);
  const removed = meta.removed.includes(videoId) ? meta.removed : [...meta.removed, videoId];
  await saveSyncMeta({ ...meta, videos, removed });
}

export async function writeVideoRecord(record: LocalVideoRecord): Promise<void> {
  await writeKeys({
    [videoSettingsKey(record.videoId)]: record.settings,
    [videoStatsKey(record.videoId)]: record.stats,
  });
}
