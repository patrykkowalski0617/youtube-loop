import { t } from "../i18n";
import { RIGHT_CONTROLS_SELECTOR } from "../youtube";

import { LOOP_SVG, PLAYER_BUTTON_ID } from "./dom";
import { mountPanel } from "./panel";
import { isPanelVisible, setPanelVisible } from "./panelVisibility";

const ACTIVE_CLASS = "ytloop-active";
const FLASH_CLASS = "ytloop-flash";
const FLASH_MS = 900;

function togglePanel(): void {
  const panel = mountPanel();
  if (!panel) return;
  const show = !isPanelVisible();
  setPanelVisible(show);
  if (!show) return;
  panel.classList.add(FLASH_CLASS);
  setTimeout(() => {
    panel.classList.remove(FLASH_CLASS);
  }, FLASH_MS);
}

export function injectPlayerButton(): void {
  const controls = document.querySelector(RIGHT_CONTROLS_SELECTOR);
  if (!controls || document.getElementById(PLAYER_BUTTON_ID)) return;
  const btn = document.createElement("button");
  btn.id = PLAYER_BUTTON_ID;
  btn.className = "ytp-button ytloop-ytp-button";
  btn.title = t.playerButton.title;
  btn.innerHTML = LOOP_SVG;
  btn.addEventListener("click", togglePanel);
  controls.insertBefore(btn, controls.firstChild);
  btn.classList.toggle(ACTIVE_CLASS, isPanelVisible());
}
