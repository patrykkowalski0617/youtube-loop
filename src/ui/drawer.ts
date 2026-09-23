import { filterSavedEntries } from "../core";
import { t } from "../i18n";
import { notify } from "../player";
import { loadPlayedSeconds, loadSavedList } from "../storage";

import { DRAWER_HANDLE_ID, DRAWER_ID, DRAWER_LIST_ID, DRAWER_SEARCH_ID, el } from "./dom";
import { shieldKeys } from "./keyShield";
import { savedCard } from "./savedCard";

const OPEN_CLASS = "open";

let query = "";
let unshieldSearch: (() => void) | null = null;
const CLOSE_ID = "ytloop-drawer-close";

export async function renderSavedList(): Promise<void> {
  const list = await loadSavedList();
  const ul = document.getElementById(DRAWER_LIST_ID);
  if (!ul) return;
  const shown = filterSavedEntries(list, query);
  ul.innerHTML = "";
  if (!shown.length) {
    ul.appendChild(el("li", "ytloop-empty", list.length ? t.drawer.noMatches : t.drawer.empty));
    return;
  }
  const played = await loadPlayedSeconds(shown.map((e) => e.videoId));
  ul.innerHTML = "";
  for (const e of shown) ul.appendChild(savedCard(e, played[e.videoId] ?? 0));
}

export function setDrawerOpen(open: boolean): void {
  const d = document.getElementById(DRAWER_ID);
  if (!d) return;
  d.classList.toggle(OPEN_CLASS, open);
  if (open) notify("saved");
}

function toggleDrawer(): void {
  const d = document.getElementById(DRAWER_ID);
  if (d) setDrawerOpen(!d.classList.contains(OPEN_CLASS));
}

export function mountDrawer(): void {
  if (document.getElementById(DRAWER_ID)) return;

  const handle = el("button");
  handle.id = DRAWER_HANDLE_ID;
  handle.title = t.drawer.handle;
  handle.appendChild(el("span", undefined, t.drawer.handle));
  handle.addEventListener("click", toggleDrawer);
  document.body.appendChild(handle);

  const drawer = el("div");
  drawer.id = DRAWER_ID;
  const head = el("div", "ytloop-drawer-head");
  const close = el("button", "ytloop-icon-btn", t.common.close);
  close.id = CLOSE_ID;
  close.title = t.drawer.close;
  close.addEventListener("click", () => {
    setDrawerOpen(false);
  });
  head.append(el("span", undefined, t.drawer.heading), close);

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

  const list = el("ul");
  list.id = DRAWER_LIST_ID;
  drawer.append(head, search, list);
  document.body.appendChild(drawer);
}

export function unmountDrawer(): void {
  query = "";
  unshieldSearch?.();
  unshieldSearch = null;
  document.getElementById(DRAWER_ID)?.remove();
  document.getElementById(DRAWER_HANDLE_ID)?.remove();
}
