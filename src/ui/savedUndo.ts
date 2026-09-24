import { t } from "../i18n";
import { removeSaved } from "../player";

import { el } from "./dom";

const UNDO_SECONDS = 5;
const TICK_MS = 1000;
const DURATION_PROP = "--undo-duration";
const ELAPSED_PROP = "--undo-elapsed";
const seconds = (value: number): string => `${value}s`;

interface Pending {
  left: number;
  timer: ReturnType<typeof setInterval>;
  label: HTMLElement | null;
}

const pending = new Map<string, Pending>();

export const isPendingRemoval = (videoId: string): boolean => pending.has(videoId);

function cancel(videoId: string): void {
  const entry = pending.get(videoId);
  if (!entry) return;
  clearInterval(entry.timer);
  pending.delete(videoId);
}

function tick(videoId: string): void {
  const entry = pending.get(videoId);
  if (!entry) return;
  entry.left -= 1;
  if (entry.left <= 0) {
    cancel(videoId);
    void removeSaved(videoId);
    return;
  }
  if (entry.label) entry.label.textContent = t.drawer.removeIn(entry.left);
}

export function startRemoval(videoId: string): void {
  if (pending.has(videoId)) return;
  pending.set(videoId, {
    left: UNDO_SECONDS,
    timer: setInterval(() => {
      tick(videoId);
    }, TICK_MS),
    label: null,
  });
}

export function clearPendingRemovals(): void {
  for (const videoId of [...pending.keys()]) cancel(videoId);
}

export function undoRow(videoId: string, onUndo: () => void): HTMLElement {
  const entry = pending.get(videoId);
  const left = entry?.left ?? UNDO_SECONDS;
  const row = el("div", "ytloop-saved-undo");
  row.style.setProperty(DURATION_PROP, seconds(UNDO_SECONDS));
  row.style.setProperty(ELAPSED_PROP, seconds(left - UNDO_SECONDS));
  const bar = el("span", "ytloop-saved-undo-bar");
  const label = el("span", "ytloop-saved-undo-left", t.drawer.removeIn(left));
  const button = el("button", "ytloop-saved-undo-btn", t.drawer.undo);
  button.title = t.drawer.undoTitle;
  button.addEventListener("click", () => {
    cancel(videoId);
    onUndo();
  });
  if (entry) entry.label = label;
  row.append(bar, label, button);
  return row;
}
