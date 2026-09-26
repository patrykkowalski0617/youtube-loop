import { dateLabel, dayFromKey, formatTime, PERCENT, TEMPO_DECIMALS } from "../core";
import { t } from "../i18n";

export const tempoText = (value: number): string => value.toFixed(TEMPO_DECIMALS);

export const timesText = (value: number): string =>
  value > 0 ? t.stats.times(tempoText(value)) : t.stats.none;

export const durationText = (seconds: number): string =>
  seconds > 0 ? formatTime(seconds) : t.stats.none;

export const countText = (value: number): string => String(Math.round(value));

export const percentText = (fraction: number): string =>
  fraction > 0 ? t.stats.percent(String(Math.round(fraction * PERCENT))) : t.stats.none;

export const dayText = (key: string | null): string =>
  key ? dateLabel(dayFromKey(key)) : t.stats.never;

export const stampText = (stamp: number): string =>
  stamp > 0 ? dateLabel(new Date(stamp)) : t.stats.never;
