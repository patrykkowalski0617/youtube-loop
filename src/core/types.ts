export interface Fragment {
  id: string;
  start: number;
  end: number;
  comment: string;
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
  panelLeft: number | null;
  panelTop: number | null;
  practiceOpen: boolean;
}
