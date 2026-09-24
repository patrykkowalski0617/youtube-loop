import { SPEED_MODES } from "../core";
import { t } from "../i18n";

import { LOOP_SVG, PANEL_ID } from "./dom";
import { extensionVersion } from "./version";

export const ids = {
  drag: "ytloop-drag",
  enable: "ytloop-enable",
  close: "ytloop-close",
  start: "ytloop-start",
  setStart: "ytloop-set-start",
  end: "ytloop-end",
  setEnd: "ytloop-set-end",
  tail: "ytloop-tail",
  constFields: "ytloop-const-fields",
  constSpeed: "ytloop-const-speed",
  speedFields: "ytloop-speed-fields",
  speedStart: "ytloop-speed-start",
  speedTarget: "ytloop-speed-target",
  speedStep: "ytloop-speed-step",
  gotoStart: "ytloop-goto-start",
  chart: "ytloop-chart",
  fragAdd: "ytloop-frag-add",
  account: "ytloop-account",
  practiceFold: "ytloop-fold-practice",
  practiceSummary: "ytloop-summary-practice",
} as const;

export const MODE_RADIO_NAME = "ytloop-speed-mode";
export const modeRadioId = (mode: string): string => `ytloop-mode-${mode}`;

const p = t.panel;

const readout = (label: string, inputId: string, buttonId: string): string => `
  <div class="ytloop-mark">
    <span class="ytloop-mark-label">${label}</span>
    <input type="text" id="${inputId}" class="ytloop-readout" placeholder="${p.timePlaceholder}" autocomplete="off" spellcheck="false">
    <button id="${buttonId}" class="ytloop-now" title="${p.setToCurrentTime}">${p.now}</button>
  </div>`;

const numberField = (label: string, inputId: string): string => `
  <label class="ytloop-field">
    <span>${label}</span>
    <input type="text" id="${inputId}" autocomplete="off" inputmode="decimal" spellcheck="false">
  </label>`;

const modeOption = (mode: string, label: string): string => `
  <label class="ytloop-segment">
    <input type="radio" name="${MODE_RADIO_NAME}" id="${modeRadioId(mode)}" value="${mode}">
    <span>${label}</span>
  </label>`;

const panelMarkup = (): string => `
  <header class="ytloop-head" id="${ids.drag}">
    <span class="ytloop-brand">${LOOP_SVG}${p.title}<small class="ytloop-version">${p.version(extensionVersion())}</small></span>
    <button id="${ids.close}" class="ytloop-icon-btn" title="${p.hidePanel}">${t.common.close}</button>
  </header>

  <div class="ytloop-deck">
    <div class="ytloop-marks">
      ${readout(p.start, ids.start, ids.setStart)}
      ${readout(p.end, ids.end, ids.setEnd)}
    </div>
    <button id="${ids.fragAdd}" class="ytloop-deck-add" title="${t.fragments.addTitle}">${t.fragments.add}</button>
  </div>

  <section class="ytloop-tempo">
      <div class="ytloop-mode-row">
        <div class="ytloop-segments">
          ${SPEED_MODES.map((mode) => modeOption(mode, p.speedMode[mode])).join("")}
        </div>
        <label class="ytloop-switch" title="${p.enable}">
          <input type="checkbox" id="${ids.enable}">
          <span class="ytloop-sr">${p.enable}</span>
        </label>
      </div>
      <div class="ytloop-fields">
        <div class="ytloop-mode-group" id="${ids.constFields}">
          ${numberField(p.speed, ids.constSpeed)}
        </div>
        <div class="ytloop-mode-group" id="${ids.speedFields}">
          ${numberField(p.startSpeed, ids.speedStart)}
          ${numberField(p.targetSpeed, ids.speedTarget)}
          ${numberField(p.step, ids.speedStep)}
        </div>
        ${numberField(p.gap, ids.tail)}
      </div>
  </section>

  <details class="ytloop-fold" id="${ids.practiceFold}">
    <summary>
      <span>${p.practiceSection}</span>
      <span class="ytloop-summary-value" id="${ids.practiceSummary}"></span>
    </summary>
    <div class="ytloop-fold-body">
      <div class="ytloop-chart" id="${ids.chart}"></div>
      <div class="ytloop-account" id="${ids.account}" hidden></div>
    </div>
  </details>

  <div class="ytloop-transport">
    <button id="${ids.gotoStart}" class="ytloop-play"></button>
  </div>`;

export function buildPanel(): HTMLDivElement {
  const panel = document.createElement("div");
  panel.id = PANEL_ID;
  panel.innerHTML = panelMarkup();
  return panel;
}
