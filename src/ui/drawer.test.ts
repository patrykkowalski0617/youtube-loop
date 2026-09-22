// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { defaultVideoSettings, type SavedEntry } from "../core";
import { store } from "../player";
import { SAVED_LIST_KEY, videoStatsKey } from "../storage";
import { type ChromeMock, installChromeMock, uninstallChromeMock } from "../testing/chromeMock";
import { flushAsync } from "../testing/flush";

import { byId } from "./dom";
import { mountDrawer, renderSavedList, setDrawerOpen, unmountDrawer } from "./drawer";

const CURRENT_ID = "current-video";
const OTHER_ID = "other-video";
const PLAYED_SECONDS = 90;

const entry = (over: Partial<SavedEntry>): SavedEntry => ({
  ...defaultVideoSettings(),
  videoId: CURRENT_ID,
  title: "A song",
  savedAt: 1,
  ...over,
});

let mock: ChromeMock;

const items = (): HTMLElement[] => [
  ...document.querySelectorAll<HTMLElement>("#ytloop-drawer-list .ytloop-saved-item"),
];

describe("drawer", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    mock = installChromeMock({
      [SAVED_LIST_KEY]: [
        entry({ start: 10, end: 20, constEnabled: true, constSpeed: 0.8 }),
        entry({ videoId: OTHER_ID, title: "Another", speedEnabled: true, speedStart: 0.5 }),
      ],
      [videoStatsKey(CURRENT_ID)]: { seconds: PLAYED_SECONDS },
    });
    store.videoId = CURRENT_ID;
    mountDrawer();
  });

  afterEach(() => {
    unmountDrawer();
    uninstallChromeMock();
  });

  it("mounts once, handle included", () => {
    mountDrawer();
    expect(document.querySelectorAll("#ytloop-drawer")).toHaveLength(1);
    expect(document.getElementById("ytloop-drawer-handle")).not.toBeNull();
  });

  it("lists every saved video and reports the count", async () => {
    let count = -1;
    await renderSavedList((n) => (count = n));
    expect(count).toBe(2);
    expect(items()).toHaveLength(2);
  });

  it("marks the video being watched", async () => {
    await renderSavedList(() => undefined);
    expect(items()[0]?.classList.contains("current")).toBe(true);
    expect(items()[1]?.classList.contains("current")).toBe(false);
  });

  it("summarises range, speed mode and played time", async () => {
    await renderSavedList(() => undefined);
    expect(items()[0]?.querySelector(".ytloop-saved-sub")?.textContent).toBe("0:10 – 0:20 · 0.80x");
    expect(items()[0]?.querySelector(".ytloop-saved-stat")?.textContent).toBe("▶ 1:30 played");
    expect(items()[1]?.querySelector(".ytloop-saved-sub")?.textContent).toContain("0.50→1.00x");
    expect(items()[1]?.querySelector(".ytloop-saved-stat")).toBeNull();
  });

  it("says so when nothing is saved", async () => {
    mock.store[SAVED_LIST_KEY] = [];
    await renderSavedList(() => undefined);
    expect(document.querySelector(".ytloop-empty")?.textContent).toBe("No saved videos yet.");
  });

  it("removes an entry through its delete button", async () => {
    await renderSavedList(() => undefined);
    items()[1]?.querySelector<HTMLElement>(".ytloop-saved-del")?.click();
    await flushAsync();
    expect((mock.store[SAVED_LIST_KEY] as SavedEntry[]).map((e) => e.videoId)).toEqual([
      CURRENT_ID,
    ]);
  });

  it("opens and closes", () => {
    const drawer = byId(document, "ytloop-drawer");
    setDrawerOpen(true);
    expect(drawer.classList.contains("open")).toBe(true);
    document.getElementById("ytloop-drawer-close")?.click();
    expect(drawer.classList.contains("open")).toBe(false);
  });

  it("applies a saved entry to the video already open", async () => {
    await renderSavedList(() => undefined);
    items()[0]?.querySelector<HTMLElement>(".ytloop-saved-main")?.click();
    await flushAsync();
    expect(store.settings.start).toBe(10);
    expect(store.settings.end).toBe(20);
    expect(store.settings.constSpeed).toBe(0.8);
  });
});
