import { TIME_ROUNDING_STEP } from "./constants";

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;
const EMPTY_TIME = "--:--";

const pad2 = (n: number): string => String(n).padStart(2, "0");

export function formatTime(sec: number | null | undefined): string {
  if (sec == null || Number.isNaN(sec)) return EMPTY_TIME;
  const total = Math.max(0, Math.floor(sec));
  const h = Math.floor(total / SECONDS_PER_HOUR);
  const m = Math.floor((total % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
  const s = total % SECONDS_PER_MINUTE;
  return h > 0 ? `${h}:${pad2(m)}:${pad2(s)}` : `${m}:${pad2(s)}`;
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
