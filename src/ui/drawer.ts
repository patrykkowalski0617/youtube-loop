import { filterSavedEntries } from "../core";
import { t } from "../i18n";
import { notify } from "../player";
import { loadPlayedSeconds, loadSavedList } from "../storage";

import {
  DRAWER_HANDLE_ID,
  DRAWER_ID,
  DRAWER_LIST_ID,
  DRAWER_SEARCH_ID,
  DRAWER_TAGS_ID,
  el,
} from "./dom";
import { mountDrawerShell, setDrawerOpen, unmountDrawerShell } from "./drawerShell";
import { clearTagFilter, renderTagFilter, selectedTags } from "./drawerTags";
import { shieldKeys } from "./keyShield";
import { savedCard } from "./savedCard";
import { clearPendingRemovals } from "./savedUndo";

let query = "";
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
  const played = await loadPlayedSeconds(shown.map((e) => e.videoId));
  ul.innerHTML = "";
  for (const e of shown) ul.appendChild(savedCard(e, played[e.videoId] ?? 0));
}

export function setSavedDrawerOpen(open: boolean): void {
  setDrawerOpen(DRAWER_ID, open);
}

function searchField(): HTMLInputElement {
  const search = el("input", "ytloop-drawer-search");
  search.id = DRAWER_SEARCH_ID;
  search.type = "search";
  search.placeholder = t.drawer.searchPlaceholder;
  search.value = query;
  unshieldSearch = shieldKeys(search);
  search.addEventListener("input", () => {
    query = search.value;
    void renderSavedList();
  });
  return search;
}

export function mountDrawer(): void {
  const drawer = mountDrawerShell({
    id: DRAWER_ID,
    handleId: DRAWER_HANDLE_ID,
    handleLabel: t.drawer.handle,
    heading: t.drawer.heading,
    closeTitle: t.drawer.close,
    onOpen: () => {
      notify("saved");
    },
  });
  if (!drawer) return;
  const tagFilter = el("div", "ytloop-tag-filter");
  tagFilter.id = DRAWER_TAGS_ID;
  const list = el("ul");
  list.id = DRAWER_LIST_ID;
  drawer.append(searchField(), tagFilter, list);
}

export function unmountDrawer(): void {
  query = "";
  clearPendingRemovals();
  clearTagFilter();
  unshieldSearch?.();
  unshieldSearch = null;
  unmountDrawerShell(DRAWER_ID);
}
