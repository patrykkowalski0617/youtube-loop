import { formatTime, TEMPO_DECIMALS } from "../core";
import { t } from "../i18n";
import { isAtSpeedTarget, isVideoPlaying, store } from "../player";

import { renderChart } from "./chart";
import { byId, inputById, setIfNotFocused } from "./dom";
import { renderFragments } from "./fragmentsList";
import { ids } from "./panelTemplate";

const DIMMED_OPACITY = "0.45";
const FULL_OPACITY = "1";
const MAXED_CLASS = "ytloop-maxed";
const ACTIVE_STATUS_CLASS = "ytloop-status active";
const STATUS_CLASS = "ytloop-status";

export function syncInputs(panel: HTMLElement): void {
  const { settings, global } = store;
  inputById(panel, ids.enable).checked = settings.enabled;
  setIfNotFocused(
    inputById(panel, ids.start),
    settings.start != null ? formatTime(settings.start) : "",
  );
  setIfNotFocused(inputById(panel, ids.end), settings.end != null ? formatTime(settings.end) : "");
  setIfNotFocused(inputById(panel, ids.tail), String(global.tail));

  inputById(panel, ids.constEnable).checked = settings.constEnabled;
  inputById(panel, ids.speedEnable).checked = settings.speedEnabled;
  setIfNotFocused(inputById(panel, ids.constSpeed), String(settings.constSpeed));
  setIfNotFocused(inputById(panel, ids.speedStart), String(settings.speedStart));
  setIfNotFocused(inputById(panel, ids.speedTarget), String(settings.speedTarget));
  setIfNotFocused(inputById(panel, ids.speedStep), String(settings.speedStep));
  byId(panel, ids.constFields).style.opacity = settings.constEnabled
    ? FULL_OPACITY
    : DIMMED_OPACITY;
  byId(panel, ids.speedFields).style.opacity = settings.speedEnabled
    ? FULL_OPACITY
    : DIMMED_OPACITY;
}

export function syncFragments(panel: HTMLElement): void {
  renderFragments(byId(panel, ids.fragList));
}

export function syncPlayButton(panel: HTMLElement): void {
  byId(panel, ids.gotoStart).textContent = isVideoPlaying()
    ? t.panel.stop
    : t.panel.playFromBeginning;
}

function statusText(): { text: string; active: boolean } {
  const { settings, stats, currentSpeed } = store;
  let text: string;
  let active = false;
  if (settings.enabled && settings.end != null) {
    text = t.status.loopActive;
    if (settings.speedEnabled) {
      text = t.status.loopAtSpeed(currentSpeed.toFixed(TEMPO_DECIMALS));
      if (isAtSpeedTarget()) text += t.status.targetReachedMark;
    }
    active = true;
  } else if (settings.start != null || settings.end != null) {
    text = t.status.loopDisabled;
  } else {
    text = t.status.setSegment;
  }
  if (stats.seconds > 0) text += t.status.totalPlayed(formatTime(stats.seconds));
  return { text, active };
}

export function syncStatus(panel: HTMLElement): void {
  const status = byId(panel, ids.status);
  const { text, active } = statusText();
  status.textContent = text;
  status.className = active ? ACTIVE_STATUS_CLASS : STATUS_CLASS;
  panel.classList.toggle(MAXED_CLASS, isAtSpeedTarget());
  renderChart(byId(panel, ids.chart));
}

export function syncSavedCount(panel: HTMLElement, count: number): void {
  byId(panel, ids.openSaved).textContent = t.panel.openSaved(count);
}
