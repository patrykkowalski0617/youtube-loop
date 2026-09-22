const PREFIX = "ytloop:";

export const GLOBAL_SETTINGS_KEY = `${PREFIX}settings`;
export const SAVED_LIST_KEY = `${PREFIX}saved`;

export const videoSettingsKey = (videoId: string): string => `${PREFIX}${videoId}`;
export const videoStatsKey = (videoId: string): string => `${PREFIX}stat:${videoId}`;

export const SYNC_META_KEY = `${PREFIX}sync`;

const STATS_INFIX = "stat:";

export function videoIdFromSettingsKey(key: string): string | null {
  if (!key.startsWith(PREFIX)) return null;
  const rest = key.slice(PREFIX.length);
  if (rest.includes(":") || rest === "settings" || rest === "saved") return null;
  return rest;
}

export function videoIdFromStatsKey(key: string): string | null {
  const prefix = PREFIX + STATS_INFIX;
  return key.startsWith(prefix) ? key.slice(prefix.length) : null;
}
