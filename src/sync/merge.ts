import {
  normalizeFragments,
  normalizeStats,
  normalizeVideoSettings,
  pickVideoSettings,
  type SavedEntry,
  type VideoSettings,
  type VideoStats,
} from "../core";

export interface RemoteVideo {
  settings: VideoSettings;
  stats: VideoStats;
  title: string | null;
  savedAt: number | null;
  updatedAt: number;
}

export interface LocalVideo {
  videoId: string;
  settings: VideoSettings;
  stats: VideoStats;
  saved: SavedEntry | null;
}

export type Winner = "local" | "remote";

export function pickWinner(localUpdatedAt: number | null, remoteUpdatedAt: number | null): Winner {
  if (remoteUpdatedAt == null) return "local";
  if (localUpdatedAt == null) return "remote";
  return localUpdatedAt > remoteUpdatedAt ? "local" : "remote";
}

export function toRemoteVideo(local: LocalVideo, updatedAt: number): RemoteVideo {
  return {
    settings: pickVideoSettings(local.settings),
    stats: local.stats,
    title: local.saved?.title ?? null,
    savedAt: local.saved?.savedAt ?? null,
    updatedAt,
  };
}

export function fromRemoteVideo(videoId: string, raw: unknown): LocalVideo & { updatedAt: number } {
  const r = (typeof raw === "object" && raw !== null ? raw : {}) as Partial<RemoteVideo>;
  const settings = normalizeVideoSettings(r.settings);
  settings.fragments = normalizeFragments(settings.fragments);
  const savedAt = typeof r.savedAt === "number" ? r.savedAt : null;
  return {
    videoId,
    settings,
    stats: normalizeStats(r.stats),
    saved:
      savedAt != null
        ? { ...settings, videoId, title: typeof r.title === "string" ? r.title : videoId, savedAt }
        : null,
    updatedAt: typeof r.updatedAt === "number" ? r.updatedAt : 0,
  };
}

export function mergeSavedList(current: SavedEntry[], incoming: SavedEntry[]): SavedEntry[] {
  const byId = new Map(current.map((e) => [e.videoId, e]));
  for (const entry of incoming) {
    const existing = byId.get(entry.videoId);
    if (!existing || entry.savedAt >= existing.savedAt) byId.set(entry.videoId, entry);
  }
  return [...byId.values()].sort((a, b) => b.savedAt - a.savedAt);
}

export function savedListChangedIds(previous: unknown, next: unknown): string[] {
  const asMap = (value: unknown): Map<string, SavedEntry> => {
    const entries = Array.isArray(value) ? (value as unknown[]) : [];
    const valid = entries.filter(
      (e): e is SavedEntry =>
        typeof e === "object" && e !== null && typeof (e as SavedEntry).videoId === "string",
    );
    return new Map(valid.map((e) => [e.videoId, e]));
  };
  const before = asMap(previous);
  const after = asMap(next);
  const changed = new Set<string>();
  for (const [videoId, entry] of after) {
    const old = before.get(videoId);
    if (old?.savedAt !== entry.savedAt || old.title !== entry.title) changed.add(videoId);
  }
  for (const videoId of before.keys()) if (!after.has(videoId)) changed.add(videoId);
  return [...changed];
}
