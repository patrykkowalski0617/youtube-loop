import {
  formatTime,
  fragmentNotes,
  normalizeTagNames,
  SAVED_NOTES_LIMIT,
  type SavedEntry,
  TEMPO_DECIMALS,
} from "../core";
import { t } from "../i18n";
import { loadEntry, removeSaved, store } from "../player";

import { el } from "./dom";
import { setDrawerOpen } from "./drawer";
import { hueOf, tagChip } from "./tagChip";

const CURRENT_CLASS = "current";

const speedText = (v: number): string => v.toFixed(TEMPO_DECIMALS);

function entrySubtitle(e: SavedEntry): string {
  const range =
    e.start != null || e.end != null
      ? t.fragments.range(formatTime(e.start ?? 0), formatTime(e.end))
      : t.drawer.noRange;
  const speed = e.constEnabled
    ? t.drawer.constSpeed(speedText(e.constSpeed))
    : e.speedEnabled
      ? t.drawer.rampSpeed(speedText(e.speedStart), speedText(e.speedTarget))
      : "";
  const count = Array.isArray(e.fragments) ? e.fragments.length : 0;
  return range + speed + (count ? t.drawer.fragmentCount(count) : "");
}

function notesRow(e: SavedEntry): HTMLElement | null {
  const { notes, hidden } = fragmentNotes(e.fragments, SAVED_NOTES_LIMIT);
  if (!notes.length) return null;
  const row = el("div", "ytloop-saved-notes");
  for (const note of notes) row.appendChild(el("span", "ytloop-saved-note", note));
  if (hidden) row.appendChild(el("span", "ytloop-saved-note-more", t.drawer.moreNotes(hidden)));
  return row;
}

function tagsRow(e: SavedEntry): HTMLElement | null {
  const names = normalizeTagNames(e.tags);
  if (!names.length) return null;
  const row = el("div", "ytloop-saved-tags");
  for (const name of names) row.appendChild(tagChip(name, hueOf(name)));
  return row;
}

export function savedCard(e: SavedEntry, played: number): HTMLElement {
  const li = el("li", "ytloop-saved-item");
  if (e.videoId === store.videoId) li.classList.add(CURRENT_CLASS);

  const main = el("div", "ytloop-saved-main");
  main.append(
    el("div", "ytloop-saved-title", e.title || e.videoId),
    el("div", "ytloop-saved-sub", entrySubtitle(e)),
  );
  const tags = tagsRow(e);
  if (tags) main.appendChild(tags);
  const notes = notesRow(e);
  if (notes) main.appendChild(notes);
  if (played > 0)
    main.appendChild(el("div", "ytloop-saved-stat", t.drawer.played(formatTime(played))));
  main.addEventListener("click", () => {
    void loadEntry(e).then((applied) => {
      if (applied) setDrawerOpen(false);
    });
  });

  const del = el("button", "ytloop-saved-del", t.common.close);
  del.title = t.drawer.remove;
  del.addEventListener("click", (ev) => {
    ev.stopPropagation();
    void removeSaved(e.videoId);
  });

  li.append(main, del);
  return li;
}
