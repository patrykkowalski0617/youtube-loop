import { fromPanelSpot } from "../core";
import { store } from "../player";

import { ACTIVE_BUTTON_CLASS, PANEL_ID, PLAYER_BUTTON_ID } from "./dom";
import { placePanel } from "./drag";
import { boxOf, viewportBox } from "./viewport";

export const getPanel = (): HTMLElement | null => document.getElementById(PANEL_ID);

export const isPanelVisible = (): boolean => {
  const panel = getPanel();
  return panel != null && !panel.hidden;
};

export function setPanelVisible(visible: boolean): void {
  const panel = getPanel();
  if (!panel) return;
  panel.hidden = !visible;
  if (visible) applyStoredPanelPosition();
  document.getElementById(PLAYER_BUTTON_ID)?.classList.toggle(ACTIVE_BUTTON_CLASS, visible);
}

let autoOpened: { videoId: string | null; panel: HTMLElement | null } | null = null;

export function autoOpenPanel(videoId: string | null, open: boolean): void {
  const panel = getPanel();
  if (autoOpened?.videoId === videoId && autoOpened.panel === panel) return;
  autoOpened = { videoId, panel };
  setPanelVisible(open);
}

export function applyStoredPanelPosition(): void {
  const panel = getPanel();
  const { panelX, panelY } = store.global;
  if (!panel || panel.hidden || panelX == null || panelY == null) return;
  const point = fromPanelSpot({ x: panelX, y: panelY }, boxOf(panel), viewportBox());
  placePanel(panel, point.left, point.top);
}
