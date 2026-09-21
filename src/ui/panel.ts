import { type ChangeKind, subscribe } from "../player";

import { PANEL_ID } from "./dom";
import { renderSavedList } from "./drawer";
import { syncFragments, syncInputs, syncPlayButton, syncSavedCount, syncStatus } from "./panelSync";
import { buildPanel } from "./panelTemplate";
import { getPanel } from "./panelVisibility";
import { wirePanel } from "./panelWire";

let unsubscribe: (() => void) | null = null;

export function syncPanel(kind: ChangeKind): void {
  const panel = getPanel();
  if (!panel) return;
  switch (kind) {
    case "settings":
      syncInputs(panel);
      syncFragments(panel);
      syncStatus(panel);
      syncPlayButton(panel);
      break;
    case "status":
      syncStatus(panel);
      break;
    case "fragments":
      syncFragments(panel);
      break;
    case "playState":
      syncPlayButton(panel);
      break;
    case "saved":
      void renderSavedList((n) => {
        syncSavedCount(panel, n);
      });
      break;
  }
}

export function mountPanel(): HTMLElement | null {
  const existing = document.getElementById(PANEL_ID);
  if (existing) return existing;
  const panel = buildPanel();
  panel.style.display = "none";
  document.body.appendChild(panel);
  wirePanel(panel);
  unsubscribe ??= subscribe(syncPanel);
  syncPanel("settings");
  return panel;
}

export function unmountPanel(): void {
  getPanel()?.remove();
  unsubscribe?.();
  unsubscribe = null;
}
