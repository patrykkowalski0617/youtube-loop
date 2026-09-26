import {
  CHART_LABEL_SLOTS,
  CHART_MIN_BAR_PERCENT,
  CHART_VALUE_MAX_DAYS,
  type DayPoint,
  PERCENT,
  type StatsReport,
  WEEK_DAYS,
} from "../core";
import { t } from "../i18n";

import { el } from "./dom";
import { durationText, tempoText } from "./statsFormat";
import { statSection } from "./statTiles";

const COLUMNS_PROPERTY = "--ytloop-chart-columns";
const BARS_CLASS = "ytloop-chart-bars";
const COL_CLASS = "ytloop-chart-col";
const TODAY_CLASS = "today";
const TEMPO_CLASS = "ytloop-chart-tempo";
const TRACK_CLASS = "ytloop-chart-track";
const BAR_CLASS = "ytloop-chart-bar";
const VALUE_CLASS = "ytloop-chart-value";
const LABEL_CLASS = "ytloop-chart-label";
const LEGEND_CLASS = "ytloop-chart-legend";
const LEGEND_ITEM_CLASS = "ytloop-chart-legend-item";
const SWATCH_CLASS = "ytloop-chart-swatch";
const SWATCH_TEMPO_CLASS = "tempo";

interface ChartLayout {
  showValues: boolean;
  stride: number;
  useWeekday: boolean;
}

const layoutFor = (count: number): ChartLayout => ({
  showValues: count <= CHART_VALUE_MAX_DAYS,
  stride: Math.ceil(count / CHART_LABEL_SLOTS),
  useWeekday: count <= WEEK_DAYS,
});

function columnTitle(point: DayPoint): string {
  const time = point.day.seconds > 0 ? durationText(point.day.seconds) : t.chart.zeroTime;
  const base = t.chart.dayTooltip(point.label, point.weekday, time, point.day.reps);
  return point.day.bestTempo > 0
    ? base + t.chart.bestTooltip(tempoText(point.day.bestTempo))
    : base;
}

function column(point: DayPoint, max: number, fromEnd: number, layout: ChartLayout): HTMLElement {
  const col = el("div", `${COL_CLASS}${point.isToday ? ` ${TODAY_CLASS}` : ""}`);
  col.title = columnTitle(point);
  const bar = el("div", BAR_CLASS);
  bar.style.height =
    point.day.seconds > 0
      ? `${Math.max(CHART_MIN_BAR_PERCENT, (point.day.seconds / max) * PERCENT)}%`
      : "0";
  const track = el("div", TRACK_CLASS);
  track.append(bar);
  const tempo = point.day.bestTempo > 0 ? t.chart.tempo(tempoText(point.day.bestTempo)) : "";
  const labelText = layout.useWeekday ? point.weekday : point.label;
  col.append(
    el("div", TEMPO_CLASS, layout.showValues ? tempo : ""),
    track,
    el(
      "div",
      VALUE_CLASS,
      layout.showValues && point.day.seconds > 0 ? durationText(point.day.seconds) : "",
    ),
    el("div", LABEL_CLASS, fromEnd % layout.stride === 0 ? labelText : ""),
  );
  return col;
}

function legend(): HTMLElement {
  const row = el("div", LEGEND_CLASS);
  for (const [text, tempo] of [
    [t.chart.legendTime, false],
    [t.chart.legendTempo, true],
  ] as const) {
    const item = el("span", LEGEND_ITEM_CLASS);
    const swatch = el("span", `${SWATCH_CLASS}${tempo ? ` ${SWATCH_TEMPO_CLASS}` : ""}`);
    item.append(swatch, el("span", undefined, text));
    row.append(item);
  }
  return row;
}

export function chartSection(report: StatsReport): HTMLElement {
  const layout = layoutFor(report.points.length);
  const max = Math.max(report.maxDaySeconds, 1);
  const bars = el("div", BARS_CLASS);
  bars.style.setProperty(COLUMNS_PROPERTY, String(report.points.length));
  const last = report.points.length - 1;
  report.points.forEach((point, index) => {
    bars.append(column(point, max, last - index, layout));
  });
  const body = el("div");
  body.append(bars, legend());
  return statSection(t.chart.heading, body, t.chart.hint);
}
