import { DEFAULT_LANGUAGE, DICTIONARIES, type Language } from "./languages";
import { type Dictionary } from "./types";

type Listener = () => void;

let current: Language = DEFAULT_LANGUAGE;

const listeners = new Set<Listener>();

export const currentLanguage = (): Language => current;

export function setLanguage(next: Language): void {
  if (next === current) return;
  current = next;
  for (const listener of listeners) listener();
}

export function onLanguageChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const t: Dictionary = new Proxy({} as Dictionary, {
  get: (_target, key) => DICTIONARIES[current][key as keyof Dictionary],
});
