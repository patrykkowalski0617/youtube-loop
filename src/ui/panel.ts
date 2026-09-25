import { type ChangeKind, subscribe } from "../player";

import { resetBurst } from "./burst";
import { PANEL_ID } from "./dom";
import { renderSavedList } from "./drawer";
import { syncInputs, syncPlayButton, syncStatus } from "./panelSync";
import { buildPanel } from "./panelTemplate";
import { getPanel } from "./panelVisibility";
import { wirePanel } from "./panelWire";
import { renderPracticeDrawer } from "./practiceDrawer";

let unsubscribe: (() => void) | null = null;

const PRACTICE_KINDS: ChangeKind[] = ["settings", "status", "account"];

export function syncPanel(kind: ChangeKind): void {
  if (kind === "saved") {
    void renderSavedList();
    return;
  }
  if (PRACTICE_KINDS.includes(kind)) renderPracticeDrawer();
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
