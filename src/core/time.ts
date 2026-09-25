import { TIME_DECIMALS, TIME_ROUNDING_STEP } from "./constants";

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;
const EMPTY_TIME = "--:--";
const SECONDS_WIDTH = 2;
const DECIMAL_POINT_WIDTH = 1;

const pad2 = (n: number): string => String(n).padStart(2, "0");

const padSeconds = (s: number): string =>
  s.toFixed(TIME_DECIMALS).padStart(SECONDS_WIDTH + DECIMAL_POINT_WIDTH + TIME_DECIMALS, "0");

const clock = (total: number, seconds: (s: number) => string): string => {
  const h = Math.floor(total / SECONDS_PER_HOUR);
  const m = Math.floor((total % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
  const s = total % SECONDS_PER_MINUTE;
  return h > 0 ? `${h}:${pad2(m)}:${seconds(s)}` : `${m}:${seconds(s)}`;
};

const isBlank = (sec: number | null | undefined): sec is null | undefined =>
  sec == null || Number.isNaN(sec);

export function formatTime(sec: number | null | undefined): string {
  if (isBlank(sec)) return EMPTY_TIME;
  return clock(Math.max(0, Math.floor(sec)), pad2);
}

export function formatTimePrecise(sec: number | null | undefined): string {
  if (isBlank(sec)) return EMPTY_TIME;
  return clock(roundToStep(Math.max(0, sec)), padSeconds);
}

export function parseTime(input: string | null | undefined): number | null {
  if (input == null) return null;
  const str = input.trim();
  if (str === "") return null;
  if (str.includes(":")) {
    const parts = str.split(":").map((p) => p.trim());
    if (parts.some((p) => p === "" || Number.isNaN(Number(p)))) return null;
    return parts.reduce((total, p) => total * SECONDS_PER_MINUTE + Number(p), 0);
  }
  const n = Number(str);
  return Number.isNaN(n) ? null : n;
}

export function parseDecimal(input: string): number {
  return parseFloat(input.replace(",", "."));
}

export function roundToStep(sec: number, step = TIME_ROUNDING_STEP): number {
  const scale = 1 / step;
  return Math.round(sec * scale) / scale;
}

export function dayKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
