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

export interface SpeedRecord {
  day: string;
  speed: number;
  prevDayBest: number;
}

export type DayMap = Record<string, number>;

export interface VideoStats {
  seconds: number;
  days: DayMap;
  daysBestSpeed: DayMap;
  speedRecords: SpeedRecord[];
}

export interface GlobalSettings {
  tail: number;
  panelOpen: boolean;
  panelX: number | null;
  panelY: number | null;
  practiceOpen: boolean;
}
