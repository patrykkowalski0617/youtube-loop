import { currentLanguage } from "../i18n";

import { mountPanel, unmountPanel } from "./panel";
import { isPanelVisible, setPanelVisible } from "./panelVisibility";
import { relabelPlayerButton } from "./playerButton";
import { renderSideDrawer } from "./sideDrawer";

export function markLanguage(node: HTMLElement): void {
  node.lang = currentLanguage();
}

export function applyLanguage(): void {
  const wasVisible = isPanelVisible();
  unmountPanel();
  mountPanel();
  setPanelVisible(wasVisible);
  relabelPlayerButton();
  renderSideDrawer();
}
