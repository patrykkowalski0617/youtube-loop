import {
  formatTime,
  fragmentNotes,
  normalizeTagNames,
  SAVED_NOTES_LIMIT,
  type SavedEntry,
} from "../core";
import { t } from "../i18n";
import { loadEntry, store } from "../player";

import { el } from "./dom";
import { setSavedDrawerOpen } from "./drawer";
import { savedTagsRow } from "./savedTags";
import { isPendingRemoval, startRemoval, undoRow } from "./savedUndo";

const CURRENT_CLASS = "current";
const PENDING_CLASS = "pending";

function notesRow(e: SavedEntry): HTMLElement | null {
  const { notes, hidden } = fragmentNotes(e.fragments, SAVED_NOTES_LIMIT);
  if (!notes.length) return null;
  const row = el("div", "ytloop-saved-notes");
  for (const note of notes) row.appendChild(el("span", "ytloop-saved-note", note));
  if (hidden) row.appendChild(el("span", "ytloop-saved-note-more", t.drawer.moreNotes(hidden)));
  return row;
}

function card(e: SavedEntry): HTMLElement {
  const li = el("li", "ytloop-saved-item");
  if (e.videoId === store.videoId) li.classList.add(CURRENT_CLASS);
  return li;
}

function pendingCard(e: SavedEntry, played: number): HTMLElement {
  const li = card(e);
  li.classList.add(PENDING_CLASS);
  li.appendChild(
    undoRow(e.videoId, () => {
      li.replaceWith(savedCard(e, played));
    }),
  );
  return li;
}

function entryCard(e: SavedEntry, played: number): HTMLElement {
  const li = card(e);

  const main = el("div", "ytloop-saved-main");
  main.appendChild(el("div", "ytloop-saved-title", e.title || e.videoId));
  main.appendChild(savedTagsRow(e.videoId, normalizeTagNames(e.tags)));
  const notes = notesRow(e);
  if (notes) main.appendChild(notes);
  if (played > 0)
    main.appendChild(el("div", "ytloop-saved-stat", t.drawer.played(formatTime(played))));
  main.addEventListener("click", () => {
    void loadEntry(e).then((applied) => {
      if (applied) setSavedDrawerOpen(false);
    });
  });

  const del = el("button", "ytloop-saved-del", t.common.close);
  del.title = t.drawer.remove;
  del.addEventListener("click", (ev) => {
    ev.stopPropagation();
    startRemoval(e.videoId);
    li.replaceWith(pendingCard(e, played));
  });

  li.append(main, del);
  return li;
}

export function savedCard(e: SavedEntry, played: number): HTMLElement {
  return isPendingRemoval(e.videoId) ? pendingCard(e, played) : entryCard(e, played);
}
