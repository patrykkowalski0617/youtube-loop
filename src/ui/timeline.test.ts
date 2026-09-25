// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { defaultVideoSettings, normalizeFragments } from "../core";
import { store } from "../player";
import { installChromeMock, uninstallChromeMock } from "../testing/chromeMock";
import { flushAsync } from "../testing/flush";

import { isEditingNote } from "./noteEditor";
import { removeTimeline, updateTimeline } from "./timeline";

const DURATION = 200;
const PARENT = { id: "p", start: 0, end: 100, comment: "chorus" };
const SUB = { id: "s", start: 20, end: 30, comment: "" };
const LATER = { id: "l", start: 120, end: 140, comment: "" };

const PLAYER_RECT = { left: 0, top: 0, right: 640, bottom: 360, width: 640, height: 360 };
const BAR_RECT = { left: 12, top: 330, right: 628, bottom: 335, width: 616, height: 5 };

function stubRect(el: Element, rect: Partial<DOMRect>): void {
  el.getBoundingClientRect = () => ({ ...rect, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
}

function mountPlayer(): void {
  document.body.innerHTML = '<div id="movie_player"><div class="ytp-progress-bar"></div></div>';
  const player = document.getElementById("movie_player");
  if (!player) throw new Error("no player");
  stubRect(player, PLAYER_RECT);
  const bar = player.querySelector(".ytp-progress-bar");
  if (bar) stubRect(bar, BAR_RECT);
}

const strip = (): HTMLElement | null => document.getElementById("ytloop-timeline");
const bars = (): HTMLElement[] => [
  ...document.querySelectorAll<HTMLElement>(".ytloop-timeline-bar"),
];

describe("timeline strip", () => {
  beforeEach(() => {
    installChromeMock();
    mountPlayer();
    store.videoId = "video";
    store.video = { duration: DURATION } as HTMLVideoElement;
    store.settings = {
      ...defaultVideoSettings(),
      fragments: normalizeFragments([PARENT, SUB, LATER]),
    };
  });

  afterEach(() => {
    for (const input of document.querySelectorAll(".ytloop-note-input")) {
      input.dispatchEvent(new FocusEvent("blur"));
    }
    removeTimeline();
    store.video = null;
    uninstallChromeMock();
  });

  it("lives in the player, not in the auto-hiding control bar", () => {
    updateTimeline();
    expect(strip()?.parentElement?.id).toBe("movie_player");
  });

  it("places a bar across the share of the video each fragment covers", () => {
    updateTimeline();
    const [first] = bars();
    expect(first?.style.left).toBe("0%");
    expect(first?.style.width).toBe("50%");
    expect(bars()[2]?.style.left).toBe("60%");
  });

  it("stacks an overlapping fragment on its own lane", () => {
    updateTimeline();
    const lanes = bars().map((b) => b.style.getPropertyValue("--ytloop-lane"));
    expect(lanes).toEqual(["0", "1", "0"]);
    expect(strip()?.style.getPropertyValue("--ytloop-lanes")).toBe("2");
  });

  it("aligns itself with the progress bar", () => {
    updateTimeline();
    expect(strip()?.style.left).toBe("12px");
    expect(strip()?.style.width).toBe("616px");
    expect(strip()?.style.bottom).toBe("30px");
  });

  it("marks the fragment currently loaded", () => {
    store.settings.start = SUB.start;
    store.settings.end = SUB.end;
    updateTimeline();
    const current = bars().filter((b) => b.classList.contains("current"));
    expect(current).toHaveLength(1);
    expect(current[0]?.style.left).toBe("10%");
  });

  it("shows the note on the bar and keeps the times in the tooltip", () => {
    updateTimeline();
    expect(bars()[0]?.querySelector(".ytloop-timeline-label")?.textContent).toBe("chorus");
    expect(bars()[0]?.title).toBe("chorus · 0:00.00 – 1:40.00 · Double-click to edit the note");
    expect(bars()[1]?.title).toBe("0:20.00 – 0:30.00 · Double-click to add a note");
  });

  it("gives the longer fragment the lane the strip draws highest", () => {
    updateTimeline();
    const laneOf = (id: string): string =>
      bars()
        .find((b) => b.title.includes(id))
        ?.style.getPropertyValue("--ytloop-lane") ?? "";
    expect(laneOf("0:00.00 – 1:40.00")).toBe("0");
    expect(laneOf("0:20.00 – 0:30.00")).toBe("1");
  });

  it("edits the note on a double click and saves it on Enter", async () => {
    updateTimeline();
    bars()[1]?.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    const input = bars()[1]?.querySelector<HTMLInputElement>(".ytloop-note-input");
    expect(input).not.toBeNull();
    if (!input) return;
    input.value = "the bend";
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await flushAsync();
    expect(store.settings.fragments.find((f) => f.id === SUB.id)?.comment).toBe("the bend");
  });

  it("removes the fragment from the editor", async () => {
    updateTimeline();
    bars()[1]?.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    bars()[1]
      ?.querySelector(".ytloop-note-remove")
      ?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    await flushAsync();
    expect(store.settings.fragments.map((f) => f.id)).toEqual([PARENT.id, LATER.id]);
  });

  it("keeps every kind of key event from reaching the player", () => {
    updateTimeline();
    bars()[1]?.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    const input = bars()[1]?.querySelector(".ytloop-note-input");
    const seen: string[] = [];
    const spy = (e: Event): void => {
      seen.push(e.type);
    };
    for (const type of ["keydown", "keyup", "keypress"]) {
      document.addEventListener(type, spy, true);
      input?.dispatchEvent(new KeyboardEvent(type, { key: " ", bubbles: true }));
      document.removeEventListener(type, spy, true);
    }
    expect(seen).toEqual([]);
  });

  it("reports that a note is being edited, so the space shortcut stands down", async () => {
    updateTimeline();
    expect(isEditingNote()).toBe(false);
    bars()[1]?.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    expect(isEditingNote()).toBe(true);
    bars()[1]?.querySelector(".ytloop-note-input")?.dispatchEvent(new FocusEvent("blur"));
    await flushAsync();
    expect(isEditingNote()).toBe(false);
  });

  it("leaves edit mode when the field loses focus", async () => {
    updateTimeline();
    bars()[0]?.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    expect(bars()[0]?.querySelector(".ytloop-note-input")).not.toBeNull();
    bars()[0]?.querySelector(".ytloop-note-input")?.dispatchEvent(new FocusEvent("blur"));
    await flushAsync();
    expect(bars()[0]?.querySelector(".ytloop-note-input")).toBeNull();
    expect(bars()[0]?.querySelector(".ytloop-timeline-label")?.textContent).toBe("chorus");
  });

  it("restores the bar when the edit is abandoned", async () => {
    updateTimeline();
    bars()[0]?.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    const input = bars()[0]?.querySelector<HTMLInputElement>(".ytloop-note-input");
    input?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await flushAsync();
    expect(bars()[0]?.querySelector(".ytloop-note-input")).toBeNull();
    expect(bars()[0]?.querySelector(".ytloop-timeline-label")?.textContent).toBe("chorus");
  });

  it("loads the fragment when its bar is clicked", () => {
    updateTimeline();
    bars()[1]?.click();
    expect(store.settings.start).toBe(SUB.start);
    expect(store.settings.end).toBe(SUB.end);
  });

  it("rebuilds only when something it draws changed", () => {
    updateTimeline();
    const first = bars()[0];
    updateTimeline();
    expect(bars()[0]).toBe(first);
    store.settings.fragments = normalizeFragments([PARENT]);
    updateTimeline();
    expect(bars()).toHaveLength(1);
  });

  it("keeps its position when the control bar is hidden and measures zero", () => {
    updateTimeline();
    const bar = document.querySelector(".ytp-progress-bar");
    if (bar) stubRect(bar, { ...BAR_RECT, width: 0 });
    updateTimeline();
    expect(strip()?.style.width).toBe("616px");
  });

  it("stays away when the video has no duration or no fragments", () => {
    store.video = { duration: Number.POSITIVE_INFINITY } as HTMLVideoElement;
    updateTimeline();
    expect(strip()).toBeNull();
    store.video = { duration: DURATION } as HTMLVideoElement;
    store.settings.fragments = [];
    updateTimeline();
    expect(strip()).toBeNull();
  });
});
