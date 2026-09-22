import { SAME_TIME_EPSILON } from "./constants";
import { type Fragment } from "./types";

export interface LanePlacement {
  fragment: Fragment;
  lane: number;
}

const duration = (f: Fragment): number => f.end - f.start;

export function assignLanes(list: Fragment[]): LanePlacement[] {
  const ordered = [...list].sort((a, b) => a.start - b.start || duration(b) - duration(a));
  const laneEnds: number[] = [];
  return ordered.map((fragment) => {
    let lane = laneEnds.findIndex((end) => end - fragment.start <= SAME_TIME_EPSILON);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = fragment.end;
    return { fragment, lane };
  });
}

export const laneCount = (placements: LanePlacement[]): number =>
  placements.reduce((count, p) => Math.max(count, p.lane + 1), 0);
