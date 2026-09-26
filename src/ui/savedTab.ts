import {
  DEFAULT_SAVED_SORT,
  emptyPlayedSummary,
  filterSavedEntries,
  isSavedSort,
  type SavedSort,
  sortSavedEntries,
} from "../core";
import { t } from "../i18n";
import { loadPlayedSummaries, loadSavedList } from "../storage";

import { DRAWER_LIST_ID, DRAWER_SEARCH_ID, DRAWER_SORT_ID, DRAWER_TAGS_ID, el } from "./dom";
import { clearTagFilter, renderTagFilter, selectedTags } from "./drawerTags";
import { shieldKeys } from "./keyShield";
import { savedCard } from "./savedCard";
import { clearPendingRemovals } from "./savedUndo";

const sortLabels = (): Record<SavedSort, string> => ({
  saved: t.drawer.sortSaved,
  played: t.drawer.sortPlayed,
  lastPlayed: t.drawer.sortLastPlayed,
  title: t.drawer.sortTitle,
});

let query = "";
let sort: SavedSort = DEFAULT_SAVED_SORT;
let unshieldSearch: (() => void) | null = null;

export async function renderSavedList(): Promise<void> {
  const list = await loadSavedList();
  const ul = document.getElementById(DRAWER_LIST_ID);
  if (!ul) return;
  const filter = document.getElementById(DRAWER_TAGS_ID);
  if (filter) renderTagFilter(filter, () => void renderSavedList());
  const shown = filterSavedEntries(list, query, selectedTags());
  ul.innerHTML = "";
  if (!shown.length) {
    ul.appendChild(el("li", "ytloop-empty", list.length ? t.drawer.noMatches : t.drawer.empty));
    return;
  }
  const played = await loadPlayedSummaries(shown.map((e) => e.videoId));
  ul.innerHTML = "";
  for (const e of sortSavedEntries(shown, sort, played))
    ul.appendChild(savedCard(e, played[e.videoId] ?? emptyPlayedSummary()));
}

function searchField(): HTMLInputElement {
  const search = el("input", "ytloop-drawer-search");
  search.id = DRAWER_SEARCH_ID;
  search.type = "search";
  search.placeholder = t.drawer.searchPlaceholder;
  search.value = query;
  unshieldSearch?.();
  unshieldSearch = shieldKeys(search);
  search.addEventListener("input", () => {
    query = search.value;
    void renderSavedList();
  });
  return search;
}

function sortField(): HTMLElement {
  const row = el("label", "ytloop-drawer-sort");
  const select = el("select");
  select.id = DRAWER_SORT_ID;
  for (const [value, label] of Object.entries(sortLabels())) {
    const option = el("option", undefined, label);
    option.value = value;
    option.selected = value === sort;
    select.appendChild(option);
  }
  select.addEventListener("change", () => {
    if (isSavedSort(select.value)) sort = select.value;
    void renderSavedList();
  });
  row.append(el("span", undefined, t.drawer.sortBy), select);
  return row;
}

export async function renderSavedTab(body: HTMLElement): Promise<void> {
  if (!document.getElementById(DRAWER_LIST_ID)) {
    const tagFilter = el("div", "ytloop-tag-filter");
    tagFilter.id = DRAWER_TAGS_ID;
    const list = el("ul");
    list.id = DRAWER_LIST_ID;
    body.innerHTML = "";
    body.append(searchField(), sortField(), tagFilter, list);
  }
  await renderSavedList();
}

export function resetSavedTab(): void {
  query = "";
  sort = DEFAULT_SAVED_SORT;
  clearPendingRemovals();
  clearTagFilter();
  unshieldSearch?.();
  unshieldSearch = null;
}
