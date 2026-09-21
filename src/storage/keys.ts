const PREFIX = "ytloop:";

export const GLOBAL_SETTINGS_KEY = `${PREFIX}settings`;
export const SAVED_LIST_KEY = `${PREFIX}saved`;

export const videoSettingsKey = (videoId: string): string => `${PREFIX}${videoId}`;
export const videoStatsKey = (videoId: string): string => `${PREFIX}stat:${videoId}`;
