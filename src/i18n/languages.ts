import { en } from "./en";
import { pl } from "./pl";
import { type Dictionary } from "./types";

export const LANGUAGES = ["en", "pl"] as const;

export type Language = (typeof LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = "en";

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: "English",
  pl: "Polski",
};

export const DICTIONARIES: Record<Language, Dictionary> = { en, pl };

export const isLanguage = (value: unknown): value is Language =>
  typeof value === "string" && (LANGUAGES as readonly string[]).includes(value);

const baseTag = (tag: string): string => tag.toLowerCase().split("-")[0] ?? "";

export function detectLanguage(tags: readonly string[]): Language {
  for (const tag of tags) {
    const base = baseTag(tag);
    if (isLanguage(base)) return base;
  }
  return DEFAULT_LANGUAGE;
}
