import { HUE_CIRCLE, HUE_GAP_MARGIN, TAG_NAME_MAX } from "./constants";
import { type Tag } from "./types";

const WHITESPACE = /\s+/gu;

export const normalizeTagName = (raw: string): string =>
  raw.replace(WHITESPACE, " ").trim().slice(0, TAG_NAME_MAX);

export const sameTagName = (a: string, b: string): boolean => a.toLowerCase() === b.toLowerCase();

export function normalizeTagNames(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const names: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const name = normalizeTagName(item);
    if (name && !names.some((taken) => sameTagName(taken, name))) names.push(name);
  }
  return names;
}

export function normalizeTags(raw: unknown): Tag[] {
  if (!Array.isArray(raw)) return [];
  const tags: Tag[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) continue;
    const { name, hue } = item as Partial<Tag>;
    if (typeof name !== "string" || typeof hue !== "number" || !Number.isFinite(hue)) continue;
    const clean = normalizeTagName(name);
    if (clean && !tags.some((taken) => sameTagName(taken.name, clean)))
      tags.push({ name: clean, hue: ((hue % HUE_CIRCLE) + HUE_CIRCLE) % HUE_CIRCLE });
  }
  return tags;
}

export const findTag = (tags: Tag[], name: string): Tag | null =>
  tags.find((tag) => sameTagName(tag.name, name)) ?? null;

interface HueGap {
  from: number;
  size: number;
}

function widestGap(hues: number[]): HueGap {
  const sorted = [...hues].sort((a, b) => a - b);
  const first = sorted[0] ?? 0;
  let widest: HueGap = { from: first, size: HUE_CIRCLE };
  sorted.forEach((from, i) => {
    const next = sorted[i + 1] ?? first + HUE_CIRCLE;
    const size = next - from;
    if (i === 0 || size > widest.size) widest = { from, size };
  });
  return widest;
}

export function pickTagHue(taken: number[], random: () => number = Math.random): number {
  if (!taken.length) return random() * HUE_CIRCLE;
  const gap = widestGap(taken);
  const usable = gap.size * (1 - 2 * HUE_GAP_MARGIN);
  const offset = gap.size * HUE_GAP_MARGIN + random() * usable;
  return (gap.from + offset) % HUE_CIRCLE;
}

export function withTag(tags: Tag[], name: string, random: () => number = Math.random): Tag[] {
  const clean = normalizeTagName(name);
  if (!clean || findTag(tags, clean)) return tags;
  return [
    ...tags,
    {
      name: clean,
      hue: pickTagHue(
        tags.map((tag) => tag.hue),
        random,
      ),
    },
  ];
}

export const withTagName = (names: string[], name: string): string[] =>
  normalizeTagNames([...names, name]);

export const withoutTagName = (names: string[], name: string): string[] =>
  names.filter((taken) => !sameTagName(taken, name));

export const hasEveryTag = (names: string[], wanted: string[]): boolean =>
  wanted.every((want) => names.some((name) => sameTagName(name, want)));

export function renamedTagNames(names: string[], from: string, to: string): string[] {
  if (!names.some((name) => sameTagName(name, from))) return names;
  return normalizeTagNames(names.map((name) => (sameTagName(name, from) ? to : name)));
}

export function renamedTags(tags: Tag[], from: string, to: string): Tag[] {
  const clean = normalizeTagName(to);
  const current = findTag(tags, from);
  if (!clean || !current) return tags;
  const clash = findTag(tags, clean);
  if (clash && clash !== current) return tags;
  return tags.map((tag) => (tag === current ? { name: clean, hue: tag.hue } : tag));
}

export function suggestTags(tags: Tag[], query: string, exclude: string[]): Tag[] {
  const wanted = normalizeTagName(query).toLowerCase();
  return tags.filter(
    (tag) =>
      !exclude.some((name) => sameTagName(name, tag.name)) &&
      (!wanted || tag.name.toLowerCase().includes(wanted)),
  );
}
