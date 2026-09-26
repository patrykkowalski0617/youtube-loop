import {
  type GlobalSettings,
  normalizeFragments,
  normalizeGlobalSettings,
  normalizeTagNames,
  normalizeTags,
  normalizeVideoSettings,
  pickVideoSettings,
  renamedTagNames,
  type SavedEntry,
  type Tag,
  type VideoSettings,
} from "../core";

import { readAll, readKey, writeKeys } from "./chromeStorage";
import {
  GLOBAL_SETTINGS_KEY,
  SAVED_LIST_KEY,
  TAGS_KEY,
  videoIdFromSettingsKey,
  videoSettingsKey,
} from "./keys";
import { purgeVideoRecord } from "./localMirror";

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

export async function loadTags(): Promise<Tag[]> {
  return normalizeTags(await readKey(TAGS_KEY));
}

export async function saveTags(tags: Tag[]): Promise<void> {
  await writeKeys({ [TAGS_KEY]: tags });
}

export async function renameTagEverywhere(from: string, to: string): Promise<void> {
  const all = await readAll();
  const updates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(all)) {
    if (!videoIdFromSettingsKey(key)) continue;
    const settings = normalizeVideoSettings(value);
    const tags = renamedTagNames(settings.tags, from, to);
    if (tags !== settings.tags) updates[key] = { ...settings, tags };
  }
  const list = await loadSavedList();
  const renamed = list.map((entry) => {
    const current = normalizeTagNames(entry.tags);
    const tags = renamedTagNames(current, from, to);
    return tags === current ? entry : { ...entry, tags };
  });
  if (renamed.some((entry, i) => entry !== list[i])) updates[SAVED_LIST_KEY] = renamed;
  if (Object.keys(updates).length) await writeKeys(updates);
}

export async function saveEntryTags(videoId: string, tags: string[]): Promise<void> {
  const settings = await loadVideoSettings(videoId);
  await saveVideoSettings(videoId, { ...settings, tags });
  await mirrorToSaved(videoId, { tags }, null);
}

const asSavedList = (raw: unknown): SavedEntry[] =>
  Array.isArray(raw) ? (raw as SavedEntry[]) : [];

export async function loadSavedList(): Promise<SavedEntry[]> {
  return asSavedList(await readKey<unknown>(SAVED_LIST_KEY));
}

function tagNamesUnder(key: string, value: unknown): string[] {
  if (key === SAVED_LIST_KEY)
    return asSavedList(value).flatMap((entry) => normalizeTagNames(entry.tags));
  return videoIdFromSettingsKey(key) ? normalizeVideoSettings(value).tags : [];
}

export async function loadUsedTagNames(): Promise<string[]> {
  const all = await readAll();
  return normalizeTagNames(
    Object.entries(all).flatMap(([key, value]) => tagNamesUnder(key, value)),
  );
}

export async function saveSavedList(list: SavedEntry[]): Promise<void> {
  await writeKeys({ [SAVED_LIST_KEY]: list });
}

export async function removeSavedEntry(videoId: string): Promise<SavedEntry[]> {
  const list = (await loadSavedList()).filter((e) => e.videoId !== videoId);
  await saveSavedList(list);
  await purgeVideoRecord(videoId);
  return list;
}

export async function mirrorToSaved(
  videoId: string,
  patch: Partial<SavedEntry>,
  createWith: (() => SavedEntry | null) | null,
): Promise<boolean> {
  const list = await loadSavedList();
  const i = list.findIndex((e) => e.videoId === videoId);
  const existing = list[i];
  const created = existing ? null : createWith?.();
  if (existing) list[i] = { ...existing, ...patch };
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
