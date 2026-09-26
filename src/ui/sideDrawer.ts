import { t } from "../i18n";
import { notify } from "../player";

import { watchAccount } from "./account";
import {
  DRAWER_BODY_ID,
  DRAWER_DOCK_ID,
  DRAWER_HANDLE_ID,
  DRAWER_ID,
  DRAWER_TABS_ID,
  el,
} from "./dom";
import { markLanguage } from "./language";
import { closeLanguageMenu } from "./languageSelect";
import { renderSavedTab } from "./savedTab";
import { segmented } from "./segmented";
import { renderSettingsTab } from "./settingsTab";
import { renderStatsTab } from "./statsTab";

export type TabId = "saved" | "stats" | "settings";

const OPEN_CLASS = "open";
const DRAWER_CLASS = "ytloop-drawer";
const HANDLE_CLASS = "ytloop-drawer-handle";
const HEAD_CLASS = "ytloop-drawer-head";
const TABS_CLASS = "ytloop-tabs";
const BODY_CLASS = "ytloop-drawer-body";
const ICON_BUTTON_CLASS = "ytloop-icon-btn";
const OUTSIDE_EVENT = "pointerdown";

let active: TabId = "saved";

const drawerOf = (): HTMLElement | null => document.getElementById(DRAWER_ID);

const bodyOf = (): HTMLElement | null => document.getElementById(DRAWER_BODY_ID);

export const isSideDrawerOpen = (): boolean => drawerOf()?.classList.contains(OPEN_CLASS) ?? false;

const tabChoices = () => [
  { value: "saved" as const, label: t.side.tabSaved },
  { value: "stats" as const, label: t.side.tabStats },
  { value: "settings" as const, label: t.side.tabSettings },
];

function renderBody(): void {
  const body = bodyOf();
  if (!body || !isSideDrawerOpen()) return;
  if (active === "saved") {
    void renderSavedTab(body);
    return;
  }
  if (active === "settings") {
    renderSettingsTab(body);
    return;
  }
  void renderStatsTab(body);
}

export function renderSideDrawer(): void {
  const tabs = document.getElementById(DRAWER_TABS_ID);
  if (tabs) {
    tabs.innerHTML = "";
    tabs.append(segmented(tabChoices(), active, setActiveTab, TABS_CLASS));
  }
  renderBody();
}

export function setActiveTab(tab: TabId): void {
  closeLanguageMenu();
  active = tab;
  if (tab === "saved") notify("saved");
  renderSideDrawer();
}

export function refreshTab(tab: TabId): void {
  if (tab === active) renderBody();
}

export function setSideDrawerOpen(open: boolean): void {
  const drawer = drawerOf();
  if (!drawer) return;
  closeLanguageMenu();
  drawer.classList.toggle(OPEN_CLASS, open);
  if (open) renderSideDrawer();
}

function closeOnOutsideClick(e: Event): void {
  const drawer = drawerOf();
  if (!(e.target instanceof Node) || !drawer?.classList.contains(OPEN_CLASS)) return;
  if (document.getElementById(DRAWER_HANDLE_ID)?.contains(e.target)) return;
  if (!drawer.contains(e.target)) setSideDrawerOpen(false);
}

function dock(): HTMLElement {
  const existing = document.getElementById(DRAWER_DOCK_ID);
  if (existing) return existing;
  const node = el("div");
  node.id = DRAWER_DOCK_ID;
  document.body.appendChild(node);
  return node;
}

function buildHandle(): HTMLElement {
  const handle = el("button", HANDLE_CLASS);
  handle.id = DRAWER_HANDLE_ID;
  handle.title = t.side.handle;
  handle.appendChild(el("span", undefined, t.side.handle));
  handle.addEventListener("click", () => {
    setSideDrawerOpen(!isSideDrawerOpen());
  });
  return handle;
}

function buildHead(): HTMLElement {
  const head = el("div", HEAD_CLASS);
  const close = el("button", ICON_BUTTON_CLASS, t.common.close);
  close.title = t.side.close;
  close.addEventListener("click", () => {
    setSideDrawerOpen(false);
  });
  head.append(el("span", undefined, t.side.title), close);
  return head;
}

export function mountSideDrawer(): void {
  if (drawerOf()) return;
  dock().appendChild(buildHandle());
  const drawer = el("div", DRAWER_CLASS);
  drawer.id = DRAWER_ID;
  markLanguage(drawer);
  const tabs = el("div");
  tabs.id = DRAWER_TABS_ID;
  const body = el("div", BODY_CLASS);
  body.id = DRAWER_BODY_ID;
  drawer.append(buildHead(), tabs, body);
  document.body.appendChild(drawer);
  document.addEventListener(OUTSIDE_EVENT, closeOnOutsideClick, true);
  watchAccount(() => {
    refreshTab("settings");
  });
  renderSideDrawer();
}

export function unmountSideDrawer(): void {
  closeLanguageMenu();
  document.removeEventListener(OUTSIDE_EVENT, closeOnOutsideClick, true);
  document.getElementById(DRAWER_HANDLE_ID)?.remove();
  document.getElementById(DRAWER_DOCK_ID)?.remove();
  drawerOf()?.remove();
}
