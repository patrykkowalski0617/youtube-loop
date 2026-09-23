import { FRAGMENT_COMMENT_MAX, SAME_TIME_EPSILON } from "./constants";
import { type Fragment } from "./types";

const ID_PREFIX = "f";
const ID_RADIX = 36;
const ID_RANDOM_LENGTH = 4;

function newFragmentId(): string {
  const time = Date.now().toString(ID_RADIX);
  const random = Math.random()
    .toString(ID_RADIX)
    .slice(2, 2 + ID_RANDOM_LENGTH);
  return `${ID_PREFIX}${time}${random}`;
}

function sameTime(a: number, b: number): boolean {
  return Math.abs(a - b) < SAME_TIME_EPSILON;
}

export function isSameRange(
  f: Pick<Fragment, "start" | "end">,
  start: number,
  end: number,
): boolean {
  return sameTime(f.start, start) && sameTime(f.end, end);
}

export function normalizeComment(value: unknown): string {
  return typeof value === "string" ? value.trim().slice(0, FRAGMENT_COMMENT_MAX) : "";
}

const isFragmentLike = (f: unknown): f is Partial<Fragment> & Pick<Fragment, "start" | "end"> =>
  typeof f === "object" &&
  f !== null &&
  typeof (f as Fragment).start === "number" &&
  typeof (f as Fragment).end === "number";

export function normalizeFragments(list: unknown): Fragment[] {
  if (!Array.isArray(list)) return [];
  return list
    .filter(isFragmentLike)
    .map((f) => ({
      id: f.id ?? newFragmentId(),
      start: f.start,
      end: f.end,
      comment: normalizeComment(f.comment),
    }))
    .sort((a, b) => a.start - b.start || a.end - b.end);
}

export function withFragment(list: Fragment[], start: number, end: number): Fragment[] {
  if (list.some((f) => isSameRange(f, start, end))) return list;
  return normalizeFragments([...list, { id: newFragmentId(), start, end, comment: "" }]);
}

export function withoutFragment(list: Fragment[], id: string): Fragment[] {
  return list.filter((f) => f.id !== id);
}

export interface NoteSummary {
  notes: string[];
  hidden: number;
}

export function fragmentNotes(fragments: unknown, limit: number): NoteSummary {
  const written = normalizeFragments(fragments)
    .map((f) => f.comment)
    .filter((comment) => comment !== "");
  return { notes: written.slice(0, limit), hidden: Math.max(0, written.length - limit) };
}

export function withFragmentComment(list: Fragment[], id: string, comment: string): Fragment[] {
  const clean = normalizeComment(comment);
  return list.map((f) => (f.id === id ? { ...f, comment: clean } : f));
}
