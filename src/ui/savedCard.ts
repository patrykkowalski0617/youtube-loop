import {
  formatTime,
  fragmentNotes,
  normalizeTagNames,
  type PlayedSummary,
  SAVED_NOTES_LIMIT,
  type SavedEntry,
} from "../core";
import { t } from "../i18n";
import { loadEntry, store } from "../player";

import { el } from "./dom";
import { savedTagsRow } from "./savedTags";
import { isPendingRemoval, startRemoval, undoRow } from "./savedUndo";
import { setSideDrawerOpen } from "./sideDrawer";
import { stampText } from "./statsFormat";

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

function playedText(played: PlayedSummary): string {
  if (!(played.seconds > 0)) return t.drawer.neverPlayed;
  const time = t.drawer.played(formatTime(played.seconds));
  if (!(played.lastPlayedAt > 0)) return time;
  return `${time} - ${t.stats.lastPlayed(stampText(played.lastPlayedAt))}`;
}

function card(e: SavedEntry): HTMLElement {
  const li = el("li", "ytloop-saved-item");
  if (e.videoId === store.videoId) li.classList.add(CURRENT_CLASS);
  return li;
}

function pendingCard(e: SavedEntry, played: PlayedSummary): HTMLElement {
  const li = card(e);
  li.classList.add(PENDING_CLASS);
  li.appendChild(
    undoRow(e.videoId, () => {
      li.replaceWith(savedCard(e, played));
    }),
  );
  return li;
}

function entryCard(e: SavedEntry, played: PlayedSummary): HTMLElement {
  const li = card(e);

  const main = el("div", "ytloop-saved-main");
  main.appendChild(el("div", "ytloop-saved-title", e.title || e.videoId));
  main.appendChild(savedTagsRow(e.videoId, normalizeTagNames(e.tags)));
  const notes = notesRow(e);
  if (notes) main.appendChild(notes);
  main.appendChild(el("div", "ytloop-saved-stat", playedText(played)));
  main.addEventListener("click", () => {
    void loadEntry(e).then((applied) => {
      if (applied) setSideDrawerOpen(false);
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

export function savedCard(e: SavedEntry, played: PlayedSummary): HTMLElement {
  return isPendingRemoval(e.videoId) ? pendingCard(e, played) : entryCard(e, played);
}
