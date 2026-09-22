import { setPanelOpen, store } from "../player";

import { byId, PANEL_ID, PLAYER_BUTTON_ID } from "./dom";
import { placePanel } from "./drag";
import { ids } from "./panelTemplate";

const ACTIVE_BUTTON_CLASS = "ytloop-active";

export const getPanel = (): HTMLElement | null => document.getElementById(PANEL_ID);

export const isPanelVisible = (): boolean => {
  const panel = getPanel();
  return panel != null && !panel.hidden;
};

export function setPanelVisible(visible: boolean, persist = true): void {
  const panel = getPanel();
  if (!panel) return;
  panel.hidden = !visible;
  setPanelOpen(visible, persist);
  document.getElementById(PLAYER_BUTTON_ID)?.classList.toggle(ACTIVE_BUTTON_CLASS, visible);
}

export function applyStoredFolds(): void {
  const panel = getPanel();
  if (!panel) return;
  (byId(panel, ids.practiceFold) as HTMLDetailsElement).open = store.global.practiceOpen;
}

export function applyStoredPanelPosition(): void {
  const panel = getPanel();
  const { panelLeft, panelTop } = store.global;
  if (!panel || panelLeft == null || panelTop == null) return;
  placePanel(panel, panelLeft, panelTop);
}
