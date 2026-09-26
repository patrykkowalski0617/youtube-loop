import { emptyDay, emptyStats } from "./statsShape";
import { type DayStats, type FragmentStats, type SessionRecord, type VideoStats } from "./types";

const num = (v: unknown, fallback = 0): number =>
  typeof v === "number" && Number.isFinite(v) ? v : fallback;

const counts = (v: unknown): Record<string, number> => {
  if (typeof v !== "object" || v === null) return {};
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(v as Record<string, unknown>)) {
    const n = num(value);
    if (n > 0) out[key] = n;
  }
  return out;
};

function normalizeDay(raw: unknown): DayStats {
  const d = emptyDay();
  if (typeof raw !== "object" || raw === null) return d;
  const r = raw as Partial<DayStats>;
  return {
    seconds: num(r.seconds),
    partialSeconds: num(r.partialSeconds),
    idleSeconds: num(r.idleSeconds),
    watchSeconds: num(r.watchSeconds),
    reps: num(r.reps),
    aborted: num(r.aborted),
    segmentSum: num(r.segmentSum),
    bestTempo: num(r.bestTempo),
    firstTempo: num(r.firstTempo),
    lastTempo: num(r.lastTempo),
    tempos: counts(r.tempos),
    hours: counts(r.hours),
  };
}

const normalizeDays = (raw: unknown): Record<string, DayStats> => {
  if (typeof raw !== "object" || raw === null) return {};
  return Object.fromEntries(
    Object.entries(raw as Record<string, unknown>).map(([key, value]) => [
      key,
      normalizeDay(value),
    ]),
  );
};

const normalizeSessions = (raw: unknown): SessionRecord[] =>
  Array.isArray(raw)
    ? raw.map((s: Partial<SessionRecord>) => ({
        startedAt: num(s.startedAt),
        endedAt: num(s.endedAt),
        seconds: num(s.seconds),
        reps: num(s.reps),
      }))
    : [];

const normalizeFragmentStats = (raw: unknown): Record<string, FragmentStats> => {
  if (typeof raw !== "object" || raw === null) return {};
  return Object.fromEntries(
    Object.entries(raw as Record<string, Partial<FragmentStats>>).map(([key, value]) => [
      key,
      {
        seconds: num(value.seconds),
        reps: num(value.reps),
        bestTempo: num(value.bestTempo),
        lastPlayedAt: num(value.lastPlayedAt),
      },
    ]),
  );
};

export function normalizeStats(raw: unknown): VideoStats {
  const d = emptyStats();
  if (typeof raw !== "object" || raw === null) return d;
  const r = raw as Partial<VideoStats>;
  return {
    seconds: num(r.seconds),
    reps: num(r.reps),
    bestTempo: num(r.bestTempo),
    targetTempo: num(r.targetTempo),
    targetReachedAt: typeof r.targetReachedAt === "string" ? r.targetReachedAt : null,
    firstPlayedAt: typeof r.firstPlayedAt === "number" ? r.firstPlayedAt : null,
    lastPlayedAt: typeof r.lastPlayedAt === "number" ? r.lastPlayedAt : null,
    days: normalizeDays(r.days),
    sessions: normalizeSessions(r.sessions),
    fragments: normalizeFragmentStats(r.fragments),
  };
}
