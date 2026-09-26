// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";

import { CHART_DAYS, dayKey, emptyDay, emptyStats, MS_PER_DAY, statsReport } from "../core";

import { chartSection } from "./chart";

const NOW = new Date("2026-09-26T12:00:00");
const keyAgo = (days: number): string => dayKey(new Date(NOW.getTime() - days * MS_PER_DAY));

const report = (range: number) =>
  statsReport(
    {
      ...emptyStats(),
      days: {
        [keyAgo(0)]: { ...emptyDay(), seconds: 120, reps: 12, bestTempo: 1.1 },
        [keyAgo(1)]: { ...emptyDay(), seconds: 60, reps: 6 },
      },
    },
    range,
    NOW,
  );

let host: HTMLElement;

const columns = (): HTMLElement[] => [...host.querySelectorAll<HTMLElement>(".ytloop-chart-col")];

beforeEach(() => {
  document.body.innerHTML = "";
  host = document.createElement("div");
  host.append(chartSection(report(CHART_DAYS)));
  document.body.append(host);
});

describe("the practice chart", () => {
  it("draws one column per day in the range", () => {
    expect(columns()).toHaveLength(CHART_DAYS);
  });

  it("scales the bars against the busiest day and leaves empty days flat", () => {
    expect(columns().at(-1)?.querySelector<HTMLElement>(".ytloop-chart-bar")?.style.height).toBe(
      "100%",
    );
    expect(columns()[0]?.querySelector<HTMLElement>(".ytloop-chart-bar")?.style.height).toBe("0px");
  });

  it("prints the time on the bar rather than hiding it in a tooltip", () => {
    expect(columns().at(-1)?.querySelector(".ytloop-chart-value")?.textContent).toBe("2:00");
  });

  it("prints the best tempo of the day above the bar", () => {
    expect(columns().at(-1)?.querySelector(".ytloop-chart-tempo")?.textContent).toBe("1.10x");
  });

  it("names the weekday in English and marks today", () => {
    const today = columns().at(-1);
    expect(today?.classList.contains("today")).toBe(true);
    expect(today?.querySelector(".ytloop-chart-label")?.textContent).toBe("Sat");
  });

  it("says what the day held in the column's tooltip", () => {
    expect(columns().at(-1)?.title).toBe("Sat, Sep 26 - 2:00 in 12 repetitions - best tempo 1.10x");
  });

  it("explains both layers in a legend", () => {
    const legend = [...host.querySelectorAll(".ytloop-chart-legend-item")].map(
      (item) => item.textContent,
    );
    expect(legend).toEqual(["Practice time", "Best tempo of the day"]);
  });

  it("drops the per-bar numbers and thins the dates on a long range", () => {
    host.innerHTML = "";
    host.append(chartSection(report(90)));
    expect(columns()).toHaveLength(90);
    expect(columns().at(-1)?.querySelector(".ytloop-chart-value")?.textContent).toBe("");
    const labelled = columns().filter(
      (col) => (col.querySelector(".ytloop-chart-label")?.textContent ?? "") !== "",
    );
    expect(labelled.length).toBeLessThan(CHART_DAYS + 1);
    expect(labelled.at(-1)).toBe(columns().at(-1));
  });
});
