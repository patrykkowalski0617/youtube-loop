import { formatTimePrecise, speedModeOf } from "../core";
import { t } from "../i18n";
import { isAtSpeedTarget, isVideoPlaying, store } from "../player";

import { updateBurst } from "./burst";
import { buttonById, byId, inputById, setIfNotFocused } from "./dom";
import { ids, modeRadioId } from "./panelTemplate";

const MAXED_CLASS = "is-maxed";

export function syncInputs(panel: HTMLElement): void {
  const { settings, global } = store;
  inputById(panel, ids.enable).checked = settings.enabled;
  setIfNotFocused(
    inputById(panel, ids.start),
    settings.start != null ? formatTimePrecise(settings.start) : "",
  );
  setIfNotFocused(
    inputById(panel, ids.end),
    settings.end != null ? formatTimePrecise(settings.end) : "",
  );
  setIfNotFocused(inputById(panel, ids.tail), String(global.tail));

  const mode = speedModeOf(settings);
  inputById(panel, modeRadioId(mode)).checked = true;
  byId(panel, ids.constFields).hidden = mode !== "fixed";
  byId(panel, ids.speedFields).hidden = mode !== "ramp";
  setIfNotFocused(inputById(panel, ids.constSpeed), String(settings.constSpeed));
  setIfNotFocused(inputById(panel, ids.speedStart), String(settings.speedStart));
  setIfNotFocused(inputById(panel, ids.speedTarget), String(settings.speedTarget));
  setIfNotFocused(inputById(panel, ids.speedStep), String(settings.speedStep));
  buttonById(panel, ids.fragAdd).disabled = settings.start == null || settings.end == null;
}

export function syncPlayButton(panel: HTMLElement): void {
  byId(panel, ids.gotoStart).textContent = isVideoPlaying()
    ? t.panel.stop
    : t.panel.playFromBeginning;
}

export function syncStatus(panel: HTMLElement): void {
  const atTarget = isAtSpeedTarget();
  panel.classList.toggle(MAXED_CLASS, atTarget);
  updateBurst(panel, atTarget);
}
