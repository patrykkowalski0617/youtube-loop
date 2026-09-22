// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { dayKey, emptyStats } from "../core";
import { store } from "../player";
import { installChromeMock, uninstallChromeMock } from "../testing/chromeMock";

import { renderChart } from "./chart";
import { byId } from "./dom";

const TODAY = dayKey();
const YESTERDAY = dayKey(new Date(Date.now() - 24 * 3600 * 1000));
const TODAY_SECONDS = 600;
const YESTERDAY_SECONDS = 300;

let chart: HTMLElement;

const columns = (): HTMLElement[] => [...chart.querySelectorAll<HTMLElement>(".ytloop-chart-col")];
const text = (selector: string): string =>
  chart.querySelector<HTMLElement>(selector)?.textContent ?? "";

describe("renderChart", () => {
  beforeEach(() => {
    installChromeMock();
    document.body.innerHTML = '<div id="chart"></div>';
    chart = byId(document, "chart");
    store.videoId = "video";
    store.stats = {
      ...emptyStats(),
      seconds: TODAY_SECONDS + YESTERDAY_SECONDS,
      days: { [TODAY]: TODAY_SECONDS, [YESTERDAY]: YESTERDAY_SECONDS },
      daysBestSpeed: { [TODAY]: 1.25 },
    };
  });

  afterEach(uninstallChromeMock);

  it("stays hidden until something has been played", () => {
    store.stats = emptyStats();
    renderChart(chart);
    expect(chart.style.display).toBe("none");
    expect(chart.innerHTML).toBe("");
  });

  it("draws one column per day of the week with today last", () => {
    renderChart(chart);
    const cols = columns();
    expect(cols).toHaveLength(7);
    expect(cols.at(-1)?.classList.contains("today")).toBe(true);
    expect(cols.at(-1)?.title).toContain(TODAY);
  });

  it("scales bars against the busiest day and leaves empty days flat", () => {
    renderChart(chart);
    const heights = columns().map(
      (c) => c.querySelector<HTMLElement>(".ytloop-chart-bar")?.style.height,
    );
    expect(heights.at(-1)).toBe("100%");
    expect(heights.at(-2)).toBe("50%");
    expect(heights[0]).toBe("0%");
  });

  it("keeps a barely-practised day visible as a stub", () => {
    store.stats.days[YESTERDAY] = 1;
    renderChart(chart);
    const bar = columns().at(-2)?.querySelector<HTMLElement>(".ytloop-chart-bar");
    expect(bar?.style.height).toBe("8%");
  });

  it("sums the week in the header and labels the day's tempo", () => {
    renderChart(chart);
    expect(text(".ytloop-chart-sum")).toBe("15:00");
    expect(columns().at(-1)?.querySelector(".ytloop-chart-tempo")?.textContent).toBe("1.25x");
  });

  it("reports the overall fastest tempo", () => {
    renderChart(chart);
    expect(text(".ytloop-chart-fastest")).toBe("Fastest tempo: 1.25x");
    store.stats.daysBestSpeed = {};
    renderChart(chart);
    expect(text(".ytloop-chart-fastest")).toBe("No tempo yet");
  });

  it("offers the undo button only while there is a record to drop", () => {
    renderChart(chart);
    expect(chart.querySelector("#ytloop-undo-record")).toBeNull();
    store.stats.speedRecords = [{ day: TODAY, speed: 1.25, prevDayBest: 1 }];
    renderChart(chart);
    expect(chart.querySelector("#ytloop-undo-record")).not.toBeNull();
  });

  it("drops the last record when the undo button is clicked", () => {
    store.stats.speedRecords = [{ day: TODAY, speed: 1.25, prevDayBest: 1 }];
    renderChart(chart);
    chart.querySelector<HTMLElement>("#ytloop-undo-record")?.click();
    expect(store.stats.speedRecords).toHaveLength(0);
    expect(store.stats.daysBestSpeed[TODAY]).toBe(1);
  });
});
