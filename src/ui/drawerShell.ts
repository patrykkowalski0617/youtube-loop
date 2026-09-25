import { t } from "../i18n";

import { DRAWER_DOCK_ID, el } from "./dom";

const OPEN_CLASS = "open";
const DRAWER_CLASS = "ytloop-drawer";
const HANDLE_CLASS = "ytloop-drawer-handle";
const HEAD_CLASS = "ytloop-drawer-head";
const ICON_BUTTON_CLASS = "ytloop-icon-btn";
const OUTSIDE_EVENT = "pointerdown";
const CLOSE_SUFFIX = "-close";

export interface DrawerSpec {
  id: string;
  handleId: string;
  handleLabel: string;
  heading: string;
  closeTitle: string;
  headValue?: HTMLElement;
  onOpen?: () => void;
}

interface Shell {
  handleId: string;
  onOpen: (() => void) | null;
}

const shells = new Map<string, Shell>();

const drawerOf = (id: string): HTMLElement | null => document.getElementById(id);

export const isDrawerOpen = (id: string): boolean =>
  drawerOf(id)?.classList.contains(OPEN_CLASS) ?? false;

export function setDrawerOpen(id: string, open: boolean): void {
  const drawer = drawerOf(id);
  if (!drawer) return;
  if (open) for (const other of shells.keys()) if (other !== id) setDrawerOpen(other, false);
  drawer.classList.toggle(OPEN_CLASS, open);
  if (open) shells.get(id)?.onOpen?.();
}

const insideHandle = (node: Node): boolean =>
  [...shells.values()].some(
    ({ handleId }) => document.getElementById(handleId)?.contains(node) ?? false,
  );

function closeOnOutsideClick(e: Event): void {
  if (!(e.target instanceof Node) || insideHandle(e.target)) return;
  for (const id of shells.keys()) {
    const drawer = drawerOf(id);
    if (drawer?.classList.contains(OPEN_CLASS) && !drawer.contains(e.target)) {
      setDrawerOpen(id, false);
    }
  }
}

function dock(): HTMLElement {
  const existing = document.getElementById(DRAWER_DOCK_ID);
  if (existing) return existing;
  const node = el("div");
  node.id = DRAWER_DOCK_ID;
  document.body.appendChild(node);
  return node;
}

function buildHandle(spec: DrawerSpec): HTMLElement {
  const handle = el("button", HANDLE_CLASS);
  handle.id = spec.handleId;
  handle.title = spec.handleLabel;
  handle.appendChild(el("span", undefined, spec.handleLabel));
  handle.addEventListener("click", () => {
    setDrawerOpen(spec.id, !isDrawerOpen(spec.id));
  });
  return handle;
}

function buildHead(spec: DrawerSpec): HTMLElement {
  const head = el("div", HEAD_CLASS);
  const close = el("button", ICON_BUTTON_CLASS, t.common.close);
  close.id = `${spec.id}${CLOSE_SUFFIX}`;
  close.title = spec.closeTitle;
  close.addEventListener("click", () => {
    setDrawerOpen(spec.id, false);
  });
  head.appendChild(el("span", undefined, spec.heading));
  if (spec.headValue) head.appendChild(spec.headValue);
  head.appendChild(close);
  return head;
}

export function mountDrawerShell(spec: DrawerSpec): HTMLElement | null {
  if (drawerOf(spec.id)) return null;
  dock().appendChild(buildHandle(spec));
  const drawer = el("div", DRAWER_CLASS);
  drawer.id = spec.id;
  drawer.appendChild(buildHead(spec));
  document.body.appendChild(drawer);
  if (!shells.size) document.addEventListener(OUTSIDE_EVENT, closeOnOutsideClick, true);
  shells.set(spec.id, { handleId: spec.handleId, onOpen: spec.onOpen ?? null });
  return drawer;
}

export function unmountDrawerShell(id: string): void {
  const shell = shells.get(id);
  if (shell) document.getElementById(shell.handleId)?.remove();
  drawerOf(id)?.remove();
  shells.delete(id);
  if (shells.size) return;
  document.removeEventListener(OUTSIDE_EVENT, closeOnOutsideClick, true);
  document.getElementById(DRAWER_DOCK_ID)?.remove();
}
