import {
  assignLanes,
  formatTimePrecise,
  type Fragment,
  isSameRange,
  laneCount,
  type LanePlacement,
} from "../core";
import { t } from "../i18n";
import { loadFragment, removeFragment, store } from "../player";
import { getPlayerElement, PROGRESS_BAR_SELECTOR } from "../youtube";

import { el } from "./dom";
import { noteGestureTitle, openNoteEditor } from "./noteEditor";

const TIMELINE_ID = "ytloop-timeline";
const BAR_CLASS = "ytloop-timeline-bar";
const CURRENT_CLASS = "current";
const LABEL_CLASS = "ytloop-timeline-label";
const LANE_PROPERTY = "--ytloop-lane";
const LANES_PROPERTY = "--ytloop-lanes";
const FULL_PERCENT = 100;

let renderedSignature = "";

const getStrip = (): HTMLElement | null => document.getElementById(TIMELINE_ID);

function ensureStrip(player: HTMLElement): HTMLElement {
  const existing = getStrip();
  if (existing?.parentElement === player) return existing;
  existing?.remove();
  const strip = document.createElement("div");
  strip.id = TIMELINE_ID;
  player.appendChild(strip);
  return strip;
}

function signatureOf(placements: LanePlacement[], duration: number): string {
  const { start, end } = store.settings;
  const bars = placements
    .map(
      (p) =>
        `${p.fragment.id}:${p.lane}:${p.fragment.start}:${p.fragment.end}:${p.fragment.comment}`,
    )
    .join("|");
  return `${duration}#${String(start)}#${String(end)}#${bars}`;
}

function buildBar(placement: LanePlacement, duration: number): HTMLElement {
  const { fragment, lane } = placement;
  const bar = el("div", BAR_CLASS);
  bar.role = "button";
  bar.tabIndex = 0;
  bar.style.left = `${(fragment.start / duration) * FULL_PERCENT}%`;
  bar.style.width = `${((fragment.end - fragment.start) / duration) * FULL_PERCENT}%`;
  bar.style.setProperty(LANE_PROPERTY, String(lane));
  const range = t.fragments.range(
    formatTimePrecise(fragment.start),
    formatTimePrecise(fragment.end),
  );
  bar.title = `${fragment.comment ? `${fragment.comment} · ` : ""}${range} · ${noteGestureTitle(fragment)}`;
  if (isCurrent(fragment)) bar.classList.add(CURRENT_CLASS);
  bar.appendChild(el("span", LABEL_CLASS, fragment.comment));
  bar.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    loadFragment(fragment);
  });
  bar.addEventListener("dblclick", (e) => {
    e.preventDefault();
    e.stopPropagation();
    openNoteEditor({
      host: bar,
      fragment,
      close: () => {
        renderedSignature = "";
        updateTimeline();
      },
      onRemove: () => {
        removeFragment(fragment.id);
      },
    });
  });
  return bar;
}

function isCurrent(f: Fragment): boolean {
  const { start, end } = store.settings;
  return start != null && end != null && isSameRange(f, start, end);
}

function position(strip: HTMLElement, player: HTMLElement): void {
  const bar = document.querySelector(PROGRESS_BAR_SELECTOR);
  if (!bar) return;
  const barRect = bar.getBoundingClientRect();
  if (barRect.width === 0) return;
  const playerRect = player.getBoundingClientRect();
  strip.style.left = `${barRect.left - playerRect.left}px`;
  strip.style.width = `${barRect.width}px`;
  strip.style.bottom = `${playerRect.bottom - barRect.top}px`;
}

export function updateTimeline(): void {
  const player = getPlayerElement();
  const duration = store.video?.duration;
  const { fragments } = store.settings;
  if (!player || !duration || !Number.isFinite(duration) || !fragments.length) {
    removeTimeline();
    return;
  }
  const strip = ensureStrip(player);
  const placements = assignLanes(fragments);
  const signature = signatureOf(placements, duration);
  if (signature !== renderedSignature) {
    renderedSignature = signature;
    strip.innerHTML = "";
    strip.style.setProperty(LANES_PROPERTY, String(laneCount(placements)));
    for (const placement of placements) strip.appendChild(buildBar(placement, duration));
  }
  position(strip, player);
}

export function removeTimeline(): void {
  getStrip()?.remove();
  renderedSignature = "";
}
