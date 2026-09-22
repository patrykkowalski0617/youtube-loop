import { t } from "../i18n";

import { LOOP_SVG, PANEL_ID } from "./dom";

export const ids = {
  drag: "ytloop-drag",
  enable: "ytloop-enable",
  close: "ytloop-close",
  start: "ytloop-start",
  setStart: "ytloop-set-start",
  end: "ytloop-end",
  setEnd: "ytloop-set-end",
  tail: "ytloop-tail",
  constEnable: "ytloop-const-enable",
  constFields: "ytloop-const-fields",
  constSpeed: "ytloop-const-speed",
  speedEnable: "ytloop-speed-enable",
  speedFields: "ytloop-speed-fields",
  speedStart: "ytloop-speed-start",
  speedTarget: "ytloop-speed-target",
  speedStep: "ytloop-speed-step",
  gotoStart: "ytloop-goto-start",
  clear: "ytloop-clear",
  save: "ytloop-save",
  openSaved: "ytloop-open-saved",
  account: "ytloop-account",
  status: "ytloop-status",
  chart: "ytloop-chart",
  fragList: "ytloop-frag-list",
  fragAdd: "ytloop-frag-add",
} as const;

const p = t.panel;

const timeField = (label: string, inputId: string, buttonId: string): string => `
  <div class="ytloop-field">
    <label>${label}</label>
    <div class="ytloop-input-group">
      <input type="text" id="${inputId}" placeholder="${p.timePlaceholder}" autocomplete="off">
      <button id="${buttonId}" title="${p.setToCurrentTime}">${p.now}</button>
    </div>
  </div>`;

const decimalField = (label: string, inputId: string): string => `
  <div class="ytloop-field">
    <label>${label}</label>
    <input type="text" id="${inputId}" autocomplete="off" inputmode="decimal">
  </div>`;

const switchRow = (inputId: string, label: string, extraClass = ""): string => `
  <label class="ytloop-switch ${extraClass}">
    <input type="checkbox" id="${inputId}">
    <span>${label}</span>
  </label>`;

const panelMarkup = (): string => `
  <div class="ytloop-header" id="${ids.drag}">
    <span class="ytloop-title"><span class="ytloop-title-icon">${LOOP_SVG}</span>${p.title}</span>
    <div class="ytloop-header-right">
      ${switchRow(ids.enable, p.enable)}
      <button id="${ids.close}" class="ytloop-close" title="${p.hidePanel}">${t.common.close}</button>
    </div>
  </div>
  <div class="ytloop-body">
    <div class="ytloop-main">
      <div class="ytloop-row">
        ${timeField(p.start, ids.start, ids.setStart)}
        ${timeField(p.end, ids.end, ids.setEnd)}
      </div>
      <div class="ytloop-row">
        <div class="ytloop-field">
          <label>${p.gap}</label>
          <div class="ytloop-input-group">
            <input type="text" id="${ids.tail}" placeholder="${p.gapPlaceholder}" autocomplete="off" inputmode="decimal">
          </div>
        </div>
      </div>
      <div class="ytloop-speed">
        ${switchRow(ids.constEnable, p.constantSpeed, "ytloop-speed-toggle")}
        <div class="ytloop-row" id="${ids.constFields}">
          ${decimalField(p.speed, ids.constSpeed)}
        </div>
      </div>
      <div class="ytloop-speed">
        ${switchRow(ids.speedEnable, p.gradualSpeed, "ytloop-speed-toggle")}
        <div class="ytloop-row" id="${ids.speedFields}">
          ${decimalField(p.startSpeed, ids.speedStart)}
          ${decimalField(p.targetSpeed, ids.speedTarget)}
          ${decimalField(p.step, ids.speedStep)}
        </div>
        <div class="ytloop-hint">${p.speedHint}</div>
      </div>
      <div class="ytloop-actions">
        <button id="${ids.gotoStart}" class="ytloop-secondary">${p.playFromBeginning}</button>
        <button id="${ids.clear}" class="ytloop-secondary">${p.clear}</button>
      </div>
      <div class="ytloop-actions">
        <button id="${ids.save}" class="ytloop-secondary">${p.save}</button>
        <button id="${ids.openSaved}" class="ytloop-secondary">${p.openSavedPlain}</button>
      </div>
      <div class="ytloop-account" id="${ids.account}" hidden></div>
      <div class="ytloop-status" id="${ids.status}"></div>
      <div class="ytloop-chart" id="${ids.chart}" style="display:none"></div>
    </div>
    <div class="ytloop-frags">
      <div class="ytloop-frags-head">${t.fragments.heading}</div>
      <ul class="ytloop-frag-list" id="${ids.fragList}"></ul>
      <button id="${ids.fragAdd}" class="ytloop-frag-add" title="${t.fragments.addTitle}">${t.fragments.add}</button>
    </div>
  </div>`;

export function buildPanel(): HTMLDivElement {
  const panel = document.createElement("div");
  panel.id = PANEL_ID;
  panel.innerHTML = panelMarkup();
  return panel;
}
