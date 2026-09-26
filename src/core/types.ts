export interface Fragment {
  id: string;
  start: number;
  end: number;
  comment: string;
}

export interface Tag {
  name: string;
  hue: number;
}

export interface VideoSettings {
  start: number | null;
  end: number | null;
  enabled: boolean;
  constEnabled: boolean;
  constSpeed: number;
  speedEnabled: boolean;
  speedStart: number;
  speedTarget: number;
  speedStep: number;
  fragments: Fragment[];
  tags: string[];
}

export interface SavedEntry extends VideoSettings {
  videoId: string;
  title: string;
  savedAt: number;
}

export interface DayStats {
  seconds: number;
  partialSeconds: number;
  idleSeconds: number;
  watchSeconds: number;
  reps: number;
  aborted: number;
  segmentSum: number;
  bestTempo: number;
  firstTempo: number;
  lastTempo: number;
  tempos: Record<string, number>;
  hours: Record<string, number>;
}

export interface SessionRecord {
  startedAt: number;
  endedAt: number;
  seconds: number;
  reps: number;
}

export interface FragmentStats {
  seconds: number;
  reps: number;
  bestTempo: number;
  lastPlayedAt: number;
}

export interface VideoStats {
  seconds: number;
  reps: number;
  bestTempo: number;
  targetTempo: number;
  targetReachedAt: string | null;
  firstPlayedAt: number | null;
  lastPlayedAt: number | null;
  days: Record<string, DayStats>;
  sessions: SessionRecord[];
  fragments: Record<string, FragmentStats>;
}

export interface GlobalSettings {
  tail: number;
  lang: string | null;
  panelX: number | null;
  panelY: number | null;
}
