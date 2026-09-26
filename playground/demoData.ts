import {
  dayKey,
  type DayStats,
  emptyDay,
  emptyStats,
  type Fragment,
  type SavedEntry,
  type SessionRecord,
  type VideoStats,
} from "../src/core";
import {
  GLOBAL_SETTINGS_KEY,
  SAVED_LIST_KEY,
  TAGS_KEY,
  videoSettingsKey,
  videoStatsKey,
} from "../src/storage";

const DAYS = 90;
const MS_PER_DAY = 24 * 3600 * 1000;
const SEED = 20260925;
const TEMPO_DECIMALS = 2;

interface VideoSpec {
  videoId: string;
  title: string;
  tags: string[];
  fragments: Fragment[];
  activity: number;
  startTempo: number;
  targetTempo: number;
  ageDays: number;
  recentDays: number;
}

const SPECS: VideoSpec[] = [
  {
    videoId: "playground",
    title: "Playground video (CC0 sample)",
    tags: ["etudes", "left hand"],
    fragments: [
      { id: "demo-a", start: 2, end: 6.5, comment: "opening bars" },
      { id: "demo-b", start: 7, end: 11.2, comment: "the jump" },
      { id: "demo-c", start: 12, end: 15.8, comment: "" },
    ],
    activity: 0.72,
    startTempo: 0.65,
    targetTempo: 1,
    ageDays: 88,
    recentDays: 3,
  },
  {
    videoId: "dQw4w9WgXcQ",
    title: "Scale drill - C major, four octaves",
    tags: ["scales"],
    fragments: [{ id: "scale-a", start: 12, end: 24, comment: "descending run" }],
    activity: 0.45,
    startTempo: 0.7,
    targetTempo: 1.25,
    ageDays: 60,
    recentDays: 1,
  },
  {
    videoId: "kJQP7kiw5Fk",
    title: "Bach - Invention no. 8, slow read-through",
    tags: ["repertoire", "left hand"],
    fragments: [
      { id: "bach-a", start: 30, end: 46, comment: "bars 9-12" },
      { id: "bach-b", start: 61, end: 72, comment: "" },
    ],
    activity: 0.35,
    startTempo: 0.6,
    targetTempo: 0.95,
    ageDays: 40,
    recentDays: 2,
  },
  {
    videoId: "9bZkp7q19f0",
    title: "Sight-reading warm-up",
    tags: ["warm-up"],
    fragments: [],
    activity: 0.2,
    startTempo: 0.8,
    targetTempo: 1,
    ageDays: 14,
    recentDays: 0,
  },
];

const TAGS = [
  { name: "etudes", hue: 8 },
  { name: "left hand", hue: 96 },
  { name: "scales", hue: 200 },
  { name: "repertoire", hue: 280 },
  { name: "warm-up", hue: 46 },
];

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round = (value: number): number => Number(value.toFixed(TEMPO_DECIMALS));

const pickHour = (random: () => number): number =>
  [9, 10, 17, 18, 19, 20, 20, 21, 21, 22][Math.floor(random() * 10)] ?? 19;

interface DayBuild {
  day: DayStats;
  session: SessionRecord;
  tempo: number;
}

function buildDay(spec: VideoSpec, random: () => number, progress: number, at: number): DayBuild {
  const day = emptyDay();
  const reps = 4 + Math.floor(random() * 22);
  const tempo = round(
    Math.min(
      spec.targetTempo + 0.1,
      spec.startTempo + (spec.targetTempo - spec.startTempo) * progress + random() * 0.06,
    ),
  );
  const hour = pickHour(random);
  const segment = 4 + random() * 14;
  let seconds = 0;
  for (let i = 0; i < reps; i++) {
    const repTempo = round(Math.max(spec.startTempo, tempo - Math.floor(random() * 3) * 0.05));
    const elapsed = segment / repTempo;
    seconds += elapsed;
    day.tempos[repTempo.toFixed(TEMPO_DECIMALS)] =
      (day.tempos[repTempo.toFixed(TEMPO_DECIMALS)] ?? 0) + 1;
    day.bestTempo = Math.max(day.bestTempo, repTempo);
    if (day.firstTempo === 0) day.firstTempo = repTempo;
    day.lastTempo = repTempo;
  }
  day.reps = reps;
  day.seconds = seconds;
  day.segmentSum = segment * reps;
  day.hours[String(hour)] = seconds;
  day.aborted = Math.floor(random() * 3);
  day.partialSeconds = day.aborted * segment * 0.4;
  day.idleSeconds = reps * (0.6 + random());
  day.watchSeconds = random() < 0.4 ? 40 + random() * 200 : 0;
  const endedAt = at + hour * 3600 * 1000 + Math.floor(random() * 1800) * 1000;
  return {
    day,
    session: { startedAt: endedAt - seconds * 1000, endedAt, seconds, reps },
    tempo: day.bestTempo,
  };
}

function buildStats(spec: VideoSpec, now: number): VideoStats {
  const random = mulberry32(SEED + spec.videoId.length * 7919);
  const stats = emptyStats();
  const fragmentIds = spec.fragments.map((f) => f.id);
  for (let i = DAYS - 1; i >= 0; i--) {
    if (i > spec.ageDays) continue;
    const at = now - i * MS_PER_DAY;
    if (i >= spec.recentDays && random() > spec.activity) continue;
    const progress = 1 - i / Math.max(spec.ageDays, 1);
    const built = buildDay(spec, random, progress, at - (at % MS_PER_DAY));
    stats.days[dayKey(new Date(at))] = built.day;
    stats.sessions.push(built.session);
    stats.seconds += built.day.seconds;
    stats.reps += built.day.reps;
    stats.bestTempo = Math.max(stats.bestTempo, built.tempo);
    stats.firstPlayedAt ??= built.session.startedAt;
    stats.lastPlayedAt = built.session.endedAt;
    if (!stats.targetReachedAt && built.tempo >= spec.targetTempo)
      stats.targetReachedAt = dayKey(new Date(at));
    for (const id of fragmentIds) {
      const share = 0.2 + random() * 0.6;
      const current = stats.fragments[id] ?? {
        seconds: 0,
        reps: 0,
        bestTempo: 0,
        lastPlayedAt: 0,
      };
      if (random() < 0.25) continue;
      stats.fragments[id] = {
        seconds: current.seconds + built.day.seconds * share,
        reps: current.reps + Math.round(built.day.reps * share),
        bestTempo: Math.max(current.bestTempo, built.tempo),
        lastPlayedAt: built.session.endedAt,
      };
    }
  }
  stats.targetTempo = spec.targetTempo;
  return stats;
}

const settingsOf = (spec: VideoSpec) => ({
  start: spec.fragments[0]?.start ?? 2,
  end: spec.fragments[0]?.end ?? 8,
  enabled: false,
  constEnabled: false,
  constSpeed: 1,
  speedEnabled: true,
  speedStart: spec.startTempo,
  speedTarget: spec.targetTempo,
  speedStep: 0.05,
  fragments: spec.fragments,
  tags: spec.tags,
});

export function demoItems(now: number = Date.now()): Record<string, unknown> {
  const items: Record<string, unknown> = {
    [GLOBAL_SETTINGS_KEY]: { tail: 1, panelX: null, panelY: null },
    [TAGS_KEY]: TAGS,
  };
  const saved: SavedEntry[] = [];
  SPECS.forEach((spec, index) => {
    items[videoSettingsKey(spec.videoId)] = settingsOf(spec);
    items[videoStatsKey(spec.videoId)] = buildStats(spec, now);
    saved.push({
      ...settingsOf(spec),
      videoId: spec.videoId,
      title: spec.title,
      savedAt: now - index * 3 * MS_PER_DAY,
    });
  });
  items[SAVED_LIST_KEY] = saved;
  return items;
}
