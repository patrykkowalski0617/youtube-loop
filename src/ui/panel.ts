import { type ChangeKind, subscribe } from "../player";

import { resetBurst } from "./burst";
import { PANEL_ID } from "./dom";
import { syncInputs, syncPlayButton, syncStatus } from "./panelSync";
import { buildPanel } from "./panelTemplate";
import { getPanel } from "./panelVisibility";
import { wirePanel } from "./panelWire";
import { refreshTab } from "./sideDrawer";

let unsubscribe: (() => void) | null = null;

const STATS_KINDS: ChangeKind[] = ["settings", "status"];

export function syncPanel(kind: ChangeKind): void {
  if (kind === "saved") {
    refreshTab("saved");
    return;
  }
  if (kind === "account") refreshTab("settings");
  if (STATS_KINDS.includes(kind)) refreshTab("stats");
  const panel = getPanel();
  if (!panel) return;
  switch (kind) {
    case "settings":
      syncInputs(panel);
      syncStatus(panel);
      syncPlayButton(panel);
      break;
    case "status":
      syncStatus(panel);
      break;
    case "playState":
      syncPlayButton(panel);
      break;
    default:
      break;
  }
}

export function mountPanel(): HTMLElement | null {
  const existing = document.getElementById(PANEL_ID);
  if (existing) return existing;
  const panel = buildPanel();
  panel.hidden = true;
  document.body.appendChild(panel);
  wirePanel(panel);
  unsubscribe ??= subscribe(syncPanel);
  syncPanel("settings");
  return panel;
}

export function unmountPanel(): void {
  resetBurst(getPanel());
  getPanel()?.remove();
  unsubscribe?.();
  unsubscribe = null;
}
