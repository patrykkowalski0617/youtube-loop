import { parseDecimal, parseTime } from "../core";
import { t } from "../i18n";
import {
  addFragment,
  clearLoop,
  saveCurrentToList,
  setConstEnabled,
  setConstSpeed,
  setEnabled,
  setEnd,
  setEndFromVideo,
  setSpeedEnabled,
  setSpeedStart,
  setSpeedStep,
  setSpeedTarget,
  setStart,
  setStartFromVideo,
  setTail,
  toggleLoopPlayback,
} from "../player";

import { byId, flashText, inputById, onCommit } from "./dom";
import { enableDrag } from "./drag";
import { setDrawerOpen } from "./drawer";
import { ids } from "./panelTemplate";
import { setPanelVisible } from "./panelVisibility";

const FLASH_MS = 1200;

function wireToggle(panel: HTMLElement, id: string, apply: (checked: boolean) => void): void {
  const box = inputById(panel, id);
  box.addEventListener("change", () => {
    apply(box.checked);
  });
}

function wireTimeInput(panel: HTMLElement, id: string, apply: (v: number | null) => void): void {
  const field = inputById(panel, id);
  onCommit(field, () => {
    apply(parseTime(field.value));
  });
}

function wireDecimalInput(panel: HTMLElement, id: string, apply: (v: number) => void): void {
  const field = inputById(panel, id);
  onCommit(field, () => {
    apply(parseDecimal(field.value));
  });
}

export function wirePanel(panel: HTMLElement): void {
  wireToggle(panel, ids.enable, setEnabled);
  wireToggle(panel, ids.constEnable, setConstEnabled);
  wireToggle(panel, ids.speedEnable, setSpeedEnabled);

  wireTimeInput(panel, ids.start, setStart);
  wireTimeInput(panel, ids.end, setEnd);
  wireDecimalInput(panel, ids.tail, setTail);
  wireDecimalInput(panel, ids.constSpeed, setConstSpeed);
  wireDecimalInput(panel, ids.speedStart, setSpeedStart);
  wireDecimalInput(panel, ids.speedTarget, setSpeedTarget);
  wireDecimalInput(panel, ids.speedStep, setSpeedStep);

  byId(panel, ids.setStart).addEventListener("click", setStartFromVideo);
  byId(panel, ids.setEnd).addEventListener("click", setEndFromVideo);
  byId(panel, ids.gotoStart).addEventListener("click", toggleLoopPlayback);
  byId(panel, ids.clear).addEventListener("click", clearLoop);
  byId(panel, ids.close).addEventListener("click", () => {
    setPanelVisible(false);
  });
  byId(panel, ids.openSaved).addEventListener("click", () => {
    setDrawerOpen(true);
  });

  const save = byId(panel, ids.save);
  save.addEventListener("click", () => {
    void saveCurrentToList();
    flashText(save, t.panel.saved, FLASH_MS);
  });

  const add = byId(panel, ids.fragAdd);
  add.addEventListener("click", () => {
    const ok = addFragment();
    flashText(add, ok ? t.fragments.added : t.fragments.needRange, FLASH_MS);
  });

  enableDrag(byId(panel, ids.drag), panel);
}
