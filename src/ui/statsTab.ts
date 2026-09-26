import { CHART_DAYS, CHART_RANGES, globalReport, type StatsReport, statsReport } from "../core";
import { t } from "../i18n";
import { store, undoLastRecord } from "../player";
import { loadAllVideoStats } from "../storage";

import { chartSection } from "./chart";
import { el } from "./dom";
import { fragmentSection, hoursSection, librarySections, tempoSection } from "./practiceCharts";
import { statTileSections } from "./practiceStats";
import { type Choice, segmented } from "./segmented";

type Scope = "video" | "all";

const CONTROLS_CLASS = "ytloop-tab-controls";
const EMPTY_CLASS = "ytloop-empty";
const UNDO_CLASS = "ytloop-undo-record";

const scopeChoices = (): Choice<Scope>[] => [
  { value: "video", label: t.practice.scopeVideo },
  { value: "all", label: t.practice.scopeAll },
];

const rangeChoices = (): Choice<number>[] =>
  CHART_RANGES.map((days) => ({
    value: days,
    label: t.practice.range(days),
    title: t.practice.rangeTitle(days),
  }));

let scope: Scope = "video";
let range: number = CHART_DAYS;
let renderToken = 0;

const rerender = (body: HTMLElement): void => {
  void renderStatsTab(body);
};

function controls(body: HTMLElement): HTMLElement {
  const row = el("div", CONTROLS_CLASS);
  row.append(
    segmented(scopeChoices(), scope, (value) => {
      scope = value;
      rerender(body);
    }),
    segmented(rangeChoices(), range, (value) => {
      range = value;
      rerender(body);
    }),
  );
  return row;
}

function undoButton(body: HTMLElement): HTMLElement | null {
  if (!store.statsUndo) return null;
  const button = el("button", UNDO_CLASS, t.practice.undoRep);
  button.title = t.practice.undoRepTitle;
  button.addEventListener("click", () => {
    undoLastRecord();
    rerender(body);
  });
  return button;
}

const isEmpty = (report: StatsReport): boolean =>
  report.totalSeconds === 0 && report.watchSeconds === 0;

const kept = (nodes: (HTMLElement | null)[]): HTMLElement[] =>
  nodes.filter((node): node is HTMLElement => node !== null);

function videoSections(): HTMLElement[] {
  const report = statsReport(store.stats, range);
  if (isEmpty(report)) return [el("p", EMPTY_CLASS, t.practice.empty)];
  return kept([
    chartSection(report),
    ...statTileSections(report),
    tempoSection(report),
    hoursSection(report),
    fragmentSection(store.settings.fragments, store.stats),
  ]);
}

async function allSections(): Promise<HTMLElement[]> {
  const global = globalReport(await loadAllVideoStats(), range);
  if (isEmpty(global.report)) return [el("p", EMPTY_CLASS, t.practice.empty)];
  return kept([
    chartSection(global.report),
    ...statTileSections(global.report),
    tempoSection(global.report),
    hoursSection(global.report),
    ...librarySections(global),
  ]);
}

export async function renderStatsTab(body: HTMLElement): Promise<void> {
  const token = ++renderToken;
  const sections = scope === "video" ? videoSections() : await allSections();
  if (token !== renderToken || !body.isConnected) return;
  body.innerHTML = "";
  body.append(controls(body), ...sections);
  const undo = undoButton(body);
  if (undo) body.append(undo);
}
