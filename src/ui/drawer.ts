import { formatTime, type SavedEntry, TEMPO_DECIMALS } from "../core";
import { t } from "../i18n";
import { loadEntry, notify, removeSaved, store } from "../player";
import { loadPlayedSeconds, loadSavedList } from "../storage";

import { DRAWER_HANDLE_ID, DRAWER_ID, DRAWER_LIST_ID, el } from "./dom";

const OPEN_CLASS = "open";
const CURRENT_CLASS = "current";
const CLOSE_ID = "ytloop-drawer-close";

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

function entryItem(e: SavedEntry, played: number): HTMLElement {
  const li = el("li", "ytloop-saved-item");
  if (e.videoId === store.videoId) li.classList.add(CURRENT_CLASS);

  const main = el("div", "ytloop-saved-main");
  main.append(
    el("div", "ytloop-saved-title", e.title || e.videoId),
    el("div", "ytloop-saved-sub", entrySubtitle(e)),
  );
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

export async function renderSavedList(): Promise<void> {
  const list = await loadSavedList();
  const ul = document.getElementById(DRAWER_LIST_ID);
  if (!ul) return;
  ul.innerHTML = "";
  if (!list.length) {
    ul.appendChild(el("li", "ytloop-empty", t.drawer.empty));
    return;
  }
  const played = await loadPlayedSeconds(list.map((e) => e.videoId));
  ul.innerHTML = "";
  for (const e of list) ul.appendChild(entryItem(e, played[e.videoId] ?? 0));
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
  const list = el("ul");
  list.id = DRAWER_LIST_ID;
  drawer.append(head, list);
  document.body.appendChild(drawer);
}

export function unmountDrawer(): void {
  document.getElementById(DRAWER_ID)?.remove();
  document.getElementById(DRAWER_HANDLE_ID)?.remove();
}
