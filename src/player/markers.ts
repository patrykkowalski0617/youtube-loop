import { PROGRESS_BAR_SELECTOR } from "../youtube";

import { store } from "./store";

const MARKERS_ID = "ytloop-markers";
const START_CLASS = "ytloop-marker-start";
const END_CLASS = "ytloop-marker-end";
const RANGE_CLASS = "ytloop-range";
const FULL_PERCENT = 100;

const MARKERS_HTML =
  `<div class="ytloop-marker ${START_CLASS}"></div>` +
  `<div class="ytloop-marker ${END_CLASS}"></div>` +
  `<div class="${RANGE_CLASS}"></div>`;

function ensureLayer(bar: Element): HTMLElement {
  const existing = document.getElementById(MARKERS_ID);
  if (existing) return existing;
  const layer = document.createElement("div");
  layer.id = MARKERS_ID;
  layer.innerHTML = MARKERS_HTML;
  bar.appendChild(layer);
  return layer;
}

function place(el: HTMLElement | null, visible: boolean, left?: number, width?: number): void {
  if (!el) return;
  el.style.display = visible ? "block" : "none";
  if (left != null) el.style.left = `${left}%`;
  if (width != null) el.style.width = `${width}%`;
}

export function updateMarkers(): void {
  const bar = document.querySelector(PROGRESS_BAR_SELECTOR);
  if (!bar) return;
  const layer = ensureLayer(bar);
  const { settings, video } = store;
  layer.style.display = settings.enabled ? "block" : "none";
  const duration = video?.duration;
  if (!duration || !Number.isFinite(duration)) return;
  const pct = (t: number): number =>
    Math.min(FULL_PERCENT, Math.max(0, (t / duration) * FULL_PERCENT));
  const { start, end } = settings;
  place(
    layer.querySelector(`.${START_CLASS}`),
    start != null,
    start != null ? pct(start) : undefined,
  );
  place(layer.querySelector(`.${END_CLASS}`), end != null, end != null ? pct(end) : undefined);
  const hasRange = start != null && end != null && end > start;
  place(
    layer.querySelector(`.${RANGE_CLASS}`),
    hasRange,
    hasRange ? pct(start) : undefined,
    hasRange ? pct(end) - pct(start) : undefined,
  );
}

export function removeMarkers(): void {
  document.getElementById(MARKERS_ID)?.remove();
}
