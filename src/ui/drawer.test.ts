// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { defaultVideoSettings, type SavedEntry } from "../core";
import { store } from "../player";
import { SAVED_LIST_KEY, videoStatsKey } from "../storage";
import { type ChromeMock, installChromeMock, uninstallChromeMock } from "../testing/chromeMock";
import { flushAsync } from "../testing/flush";

import { byId } from "./dom";
import { mountDrawer, renderSavedList, setSavedDrawerOpen, unmountDrawer } from "./drawer";

const CURRENT_ID = "current-video";
const OTHER_ID = "other-video";
const PLAYED_SECONDS = 90;
const TAG = "jazz";
const TAG_HUE = 120;

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
    store.tags = [];
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

  it("lists every saved video", async () => {
    await renderSavedList();
    expect(items()).toHaveLength(2);
  });

  it("marks the video being watched", async () => {
    await renderSavedList();
    expect(items()[0]?.classList.contains("current")).toBe(true);
    expect(items()[1]?.classList.contains("current")).toBe(false);
  });

  it("shows played time only for a video that was played", async () => {
    await renderSavedList();
    expect(items()[0]?.querySelector(".ytloop-saved-stat")?.textContent).toBe("▶ 1:30 played");
    expect(items()[1]?.querySelector(".ytloop-saved-stat")).toBeNull();
  });

  it("lists the notes written on that video's fragments", async () => {
    mock.store[SAVED_LIST_KEY] = [
      entry({
        fragments: [
          { id: "a", start: 1, end: 2, comment: "the bend" },
          { id: "b", start: 3, end: 4, comment: "" },
          { id: "c", start: 5, end: 6, comment: "slide up" },
        ],
      }),
    ];
    await renderSavedList();
    const card = items()[0];
    if (!card) throw new Error("No card rendered");
    const notes = [...card.querySelectorAll(".ytloop-saved-note")].map((n) => n.textContent);
    expect(notes).toEqual(["the bend", "slide up"]);
  });

  it("leaves the note row out when no fragment carries one", async () => {
    await renderSavedList();
    expect(items()[0]?.querySelector(".ytloop-saved-notes")).toBeNull();
  });

  it("says so when nothing is saved", async () => {
    mock.store[SAVED_LIST_KEY] = [];
    await renderSavedList();
    expect(document.querySelector(".ytloop-empty")?.textContent).toBe("No saved videos yet.");
  });

  it("offers an undo countdown instead of removing at once", async () => {
    await renderSavedList();
    items()[1]?.querySelector<HTMLElement>(".ytloop-saved-del")?.click();
    await flushAsync();
    expect(items()[1]?.querySelector(".ytloop-saved-undo-btn")).not.toBeNull();
    expect((mock.store[SAVED_LIST_KEY] as SavedEntry[]).map((e) => e.videoId)).toEqual([
      CURRENT_ID,
      OTHER_ID,
    ]);
  });

  it("filters the list by a word from a title", async () => {
    byId(document, "ytloop-drawer-search").setAttribute("value", "");
    const search = byId(document, "ytloop-drawer-search") as HTMLInputElement;
    search.value = "another";
    search.dispatchEvent(new Event("input"));
    await flushAsync();
    expect(items()).toHaveLength(1);
    expect(items()[0]?.textContent).toContain("Another");
  });

  it("filters the list by a note written on a fragment", async () => {
    mock.store[SAVED_LIST_KEY] = [
      entry({ title: "First", fragments: [{ id: "a", start: 1, end: 2, comment: "the bend" }] }),
      entry({ videoId: OTHER_ID, title: "Second", fragments: [] }),
    ];
    const search = byId(document, "ytloop-drawer-search") as HTMLInputElement;
    search.value = "bend";
    search.dispatchEvent(new Event("input"));
    await flushAsync();
    expect(items()).toHaveLength(1);
    expect(items()[0]?.textContent).toContain("First");
  });

  it("says so when the search matches nothing", async () => {
    const search = byId(document, "ytloop-drawer-search") as HTMLInputElement;
    search.value = "harmonica";
    search.dispatchEvent(new Event("input"));
    await flushAsync();
    expect(document.querySelector(".ytloop-empty")?.textContent).toBe("Nothing matches that.");
  });

  it("lets go of a filter whose tag no longer exists", async () => {
    mock.store[SAVED_LIST_KEY] = [entry({ tags: [TAG] }), entry({ videoId: OTHER_ID })];
    store.tags = [{ name: TAG, hue: TAG_HUE }];
    await renderSavedList();
    byId(document, "ytloop-drawer-tags").querySelector<HTMLElement>(".ytloop-tag")?.click();
    await flushAsync();
    expect(items()).toHaveLength(1);

    store.tags = [];
    await renderSavedList();
    expect(items()).toHaveLength(2);
  });

  it("opens and closes", () => {
    const drawer = byId(document, "ytloop-drawer");
    setSavedDrawerOpen(true);
    expect(drawer.classList.contains("open")).toBe(true);
    document.getElementById("ytloop-drawer-close")?.click();
    expect(drawer.classList.contains("open")).toBe(false);
  });

  it("applies a saved entry to the video already open", async () => {
    await renderSavedList();
    items()[0]?.querySelector<HTMLElement>(".ytloop-saved-main")?.click();
    await flushAsync();
    expect(store.settings.start).toBe(10);
    expect(store.settings.end).toBe(20);
    expect(store.settings.constSpeed).toBe(0.8);
  });
});
