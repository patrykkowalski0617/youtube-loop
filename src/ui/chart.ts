import {
  bestSpeed,
  CHART_MIN_BAR_PERCENT,
  type ChartDay,
  formatTime,
  lastDays,
  TEMPO_DECIMALS,
} from "../core";
import { t } from "../i18n";
import { store, undoLastRecord } from "../player";

import { el } from "./dom";

const FULL_PERCENT = 100;
const WEEKDAY_LENGTH = 3;
const UNDO_ID = "ytloop-undo-record";

const tempoText = (v: number): string => v.toFixed(TEMPO_DECIMALS);

function chartHead(total: number): HTMLElement {
  const head = el("div", "ytloop-chart-head");
  head.append(
    el("span", undefined, t.chart.lastDays),
    el("span", "ytloop-chart-sum", formatTime(total)),
  );
  return head;
}

function chartColumn(d: ChartDay, max: number): HTMLElement {
  const col = el("div", `ytloop-chart-col${d.isToday ? " today" : ""}`);
  const time = d.seconds > 0 ? formatTime(d.seconds) : t.chart.zeroTime;
  col.title =
    t.chart.dayTooltip(d.key, time) + (d.tempo > 0 ? t.chart.bestTooltip(tempoText(d.tempo)) : "");

  const bar = el("div", "ytloop-chart-bar");
  const pct = d.seconds > 0 ? Math.max(CHART_MIN_BAR_PERCENT, (d.seconds / max) * FULL_PERCENT) : 0;
  bar.style.height = `${pct}%`;
  const track = el("div", "ytloop-chart-track");
  track.appendChild(bar);

  const weekday = d.date
    .toLocaleDateString(undefined, { weekday: "short" })
    .slice(0, WEEKDAY_LENGTH);
  col.append(
    el("div", "ytloop-chart-tempo", d.tempo > 0 ? t.chart.tempo(tempoText(d.tempo)) : ""),
    track,
    el("div", "ytloop-chart-label", weekday),
  );
  return col;
}

function chartFoot(): HTMLElement {
  const foot = el("div", "ytloop-chart-foot");
  const best = bestSpeed(store.stats);
  const text = best > 0 ? t.chart.fastest(tempoText(best)) : t.chart.noTempo;
  foot.appendChild(el("span", "ytloop-chart-fastest", text));
  if (store.stats.speedRecords.length) {
    const undo = el("button", "ytloop-undo-record", t.chart.undoRecord);
    undo.id = UNDO_ID;
    undo.title = t.chart.undoRecordTitle;
    undo.addEventListener("click", undoLastRecord);
    foot.appendChild(undo);
  }
  return foot;
}

export function renderChart(chart: HTMLElement): void {
  if (!(store.stats.seconds > 0)) {
    chart.hidden = true;
    chart.innerHTML = "";
    return;
  }
  const days = lastDays(store.stats);
  const max = Math.max(...days.map((d) => d.seconds), 1);
  const total = days.reduce((s, d) => s + d.seconds, 0);

  chart.innerHTML = "";
  chart.hidden = false;
  const bars = el("div", "ytloop-chart-bars");
  for (const d of days) bars.appendChild(chartColumn(d, max));
  chart.append(chartHead(total), bars, chartFoot());
}
