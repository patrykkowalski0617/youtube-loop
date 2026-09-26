import {
  normalizeStats,
  normalizeTagNames,
  type PlayedSummary,
  type VideoStats,
  type VideoStatsEntry,
} from "../core";

import { readAll, readKey, readKeys, writeKeys } from "./chromeStorage";
import { videoIdFromStatsKey, videoStatsKey } from "./keys";
import { loadSavedList } from "./repositories";

export async function loadVideoStats(videoId: string): Promise<VideoStats> {
  return normalizeStats(await readKey(videoStatsKey(videoId)));
}

export async function saveVideoStats(videoId: string, stats: VideoStats): Promise<void> {
  await writeKeys({ [videoStatsKey(videoId)]: stats });
}

export async function loadPlayedSummaries(
  videoIds: string[],
): Promise<Record<string, PlayedSummary>> {
  const res = await readKeys(videoIds.map(videoStatsKey));
  const out: Record<string, PlayedSummary> = {};
  for (const id of videoIds) {
    const stats = normalizeStats(res[videoStatsKey(id)]);
    out[id] = { seconds: stats.seconds, lastPlayedAt: stats.lastPlayedAt ?? 0 };
  }
  return out;
}

export async function loadAllVideoStats(): Promise<VideoStatsEntry[]> {
  const all = await readAll();
  const titles = new Map((await loadSavedList()).map((e) => [e.videoId, e] as const));
  const entries: VideoStatsEntry[] = [];
  for (const [key, value] of Object.entries(all)) {
    const videoId = videoIdFromStatsKey(key);
    if (!videoId) continue;
    const saved = titles.get(videoId);
    entries.push({
      videoId,
      title: saved?.title ?? videoId,
      tags: normalizeTagNames(saved?.tags ?? []),
      stats: normalizeStats(value),
    });
  }
  return entries;
}
