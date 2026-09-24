import { type ChangeKind, subscribe } from "../player";

import { renderAccount, watchAccount } from "./account";
import { resetBurst } from "./burst";
import { PANEL_ID } from "./dom";
import { renderSavedList } from "./drawer";
import { syncInputs, syncPlayButton, syncStatus } from "./panelSync";
import { unwireTags } from "./panelTags";
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
      syncStatus(panel);
      syncPlayButton(panel);
      renderAccount(panel);
      break;
    case "status":
      syncStatus(panel);
      break;
    case "playState":
      syncPlayButton(panel);
      break;
    case "account":
      renderAccount(panel);
      break;
    case "saved":
      void renderSavedList();
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
  watchAccount(() => {
    syncPanel("account");
  });
  syncPanel("settings");
  return panel;
}

export function unmountPanel(): void {
  unwireTags();
  resetBurst(getPanel());
  getPanel()?.remove();
  unsubscribe?.();
  unsubscribe = null;
}
