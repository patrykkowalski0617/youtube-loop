import {
  formatTime,
  isSpeedMode,
  parseDecimal,
  parseTime,
  SPEED_MAX,
  SPEED_MIN,
  SPEED_SCRUB_STEP,
  TAIL_MIN,
  TAIL_SCRUB_STEP,
  TIME_ROUNDING_STEP,
} from "../core";
import {
  addFragment,
  clearLoop,
  setConstSpeed,
  setEnabled,
  setEnd,
  setEndFromVideo,
  setPracticeOpen,
  setSpeedMode,
  setSpeedStart,
  setSpeedStep,
  setSpeedTarget,
  setStart,
  setStartFromVideo,
  setTail,
  store,
  toggleLoopPlayback,
} from "../player";

import { byId, flashState, inputById, onCommit } from "./dom";
import { enableDrag } from "./drag";
import { ids, MODE_RADIO_NAME } from "./panelTemplate";
import { setPanelVisible } from "./panelVisibility";
import { makeScrubbable } from "./scrubbable";

const FLASH_MS = 1200;
const ADDED_CLASS = "is-added";

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
  makeScrubbable(field, {
    step: TIME_ROUNDING_STEP,
    range: { min: 0 },
    read: () => parseTime(field.value) ?? 0,
    format: formatTime,
    commit: apply,
  });
}

interface DecimalScrub {
  step: number;
  min: number;
  max?: number;
}

function wireDecimalInput(
  panel: HTMLElement,
  id: string,
  apply: (v: number) => void,
  scrub: DecimalScrub,
): void {
  const field = inputById(panel, id);
  onCommit(field, () => {
    apply(parseDecimal(field.value));
  });
  makeScrubbable(field, {
    step: scrub.step,
    range: scrub.max != null ? { min: scrub.min, max: scrub.max } : { min: scrub.min },
    read: () => parseDecimal(field.value) || 0,
    format: String,
    commit: apply,
  });
}

const SPEED_SCRUB: DecimalScrub = { step: SPEED_SCRUB_STEP, min: SPEED_MIN, max: SPEED_MAX };

function wireSpeedMode(panel: HTMLElement): void {
  for (const radio of panel.querySelectorAll<HTMLInputElement>(
    `input[name="${MODE_RADIO_NAME}"]`,
  )) {
    radio.addEventListener("change", () => {
      if (radio.checked && isSpeedMode(radio.value)) setSpeedMode(radio.value);
    });
  }
}

function wirePracticeFold(panel: HTMLElement): void {
  const details = byId(panel, ids.practiceFold) as HTMLDetailsElement;
  details.open = store.global.practiceOpen;
  details.addEventListener("toggle", () => {
    setPracticeOpen(details.open);
  });
}

export function wirePanel(panel: HTMLElement): void {
  wireToggle(panel, ids.enable, setEnabled);
  wireSpeedMode(panel);

  wireTimeInput(panel, ids.start, setStart);
  wireTimeInput(panel, ids.end, setEnd);
  wireDecimalInput(panel, ids.tail, setTail, { step: TAIL_SCRUB_STEP, min: TAIL_MIN });
  wireDecimalInput(panel, ids.constSpeed, setConstSpeed, SPEED_SCRUB);
  wireDecimalInput(panel, ids.speedStart, setSpeedStart, SPEED_SCRUB);
  wireDecimalInput(panel, ids.speedTarget, setSpeedTarget, SPEED_SCRUB);
  wireDecimalInput(panel, ids.speedStep, setSpeedStep, {
    step: SPEED_SCRUB_STEP,
    min: SPEED_SCRUB_STEP,
    max: SPEED_MAX,
  });

  byId(panel, ids.setStart).addEventListener("click", setStartFromVideo);
  byId(panel, ids.setEnd).addEventListener("click", setEndFromVideo);
  byId(panel, ids.gotoStart).addEventListener("click", toggleLoopPlayback);
  byId(panel, ids.clear).addEventListener("click", clearLoop);
  byId(panel, ids.close).addEventListener("click", () => {
    setPanelVisible(false);
  });
  const add = byId(panel, ids.fragAdd);
  add.addEventListener("click", () => {
    if (addFragment()) flashState(add, ADDED_CLASS, FLASH_MS);
  });

  wirePracticeFold(panel);

  enableDrag(byId(panel, ids.drag), panel);
}
