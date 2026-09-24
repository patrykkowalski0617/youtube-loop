// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { defaultVideoSettings, type SavedEntry } from "../core";
import { store } from "../player";
import { SAVED_LIST_KEY, TAGS_KEY, videoSettingsKey } from "../storage";
import { type ChromeMock, installChromeMock, uninstallChromeMock } from "../testing/chromeMock";
import { flushAsync } from "../testing/flush";

import { savedTagsRow } from "./savedTags";

const VIDEO_ID = "tagged-video";
const OTHER_ID = "other-video";
const TAG = "jazz";
const KNOWN_TAG = "blues";
const KNOWN_HUE = 120;
const ENTER_KEY = "Enter";

const entry = (videoId: string, tags: string[]): SavedEntry => ({
  ...defaultVideoSettings(),
  tags,
  videoId,
  title: videoId,
  savedAt: 0,
});

const savedTags = (mock: ChromeMock, videoId: string): string[] | undefined =>
  (mock.store[SAVED_LIST_KEY] as SavedEntry[]).find((e) => e.videoId === videoId)?.tags;

const row = (videoId: string, names: string[]): HTMLElement => {
  const node = savedTagsRow(videoId, names);
  document.body.appendChild(node);
  return node;
};

const chips = (node: HTMLElement): (string | null)[] =>
  [...node.querySelectorAll(".ytloop-tag")].map((chip) => chip.textContent);

const field = (node: HTMLElement): HTMLInputElement => {
  const input = node.querySelector(".ytloop-tag-input");
  if (!(input instanceof HTMLInputElement)) throw new Error("Missing tag field");
  return input;
};

const openEditor = (node: HTMLElement): HTMLInputElement => {
  node.querySelector<HTMLElement>(".ytloop-tag-add")?.click();
  return field(node);
};

let mock: ChromeMock;

describe("tags on a saved card", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    mock = installChromeMock({
      [SAVED_LIST_KEY]: [entry(VIDEO_ID, []), entry(OTHER_ID, [])],
      [TAGS_KEY]: [{ name: KNOWN_TAG, hue: KNOWN_HUE }],
    });
    store.videoId = OTHER_ID;
    store.tags = [{ name: KNOWN_TAG, hue: KNOWN_HUE }];
  });

  afterEach(() => {
    uninstallChromeMock();
    document.body.innerHTML = "";
  });

  it("offers the add chip as the last chip in the row", () => {
    const node = row(VIDEO_ID, [KNOWN_TAG]);
    expect(chips(node)).toEqual([`${KNOWN_TAG}✕`, "+ Tag"]);
    expect(node.lastElementChild?.classList.contains("ytloop-tag-add")).toBe(true);
  });

  it("puts a typed tag on that video, not on the one being watched", async () => {
    const node = row(VIDEO_ID, []);
    const input = openEditor(node);
    input.value = TAG;
    input.dispatchEvent(new KeyboardEvent("keydown", { key: ENTER_KEY, bubbles: true }));
    await flushAsync();

    expect(savedTags(mock, VIDEO_ID)).toEqual([TAG]);
    expect(savedTags(mock, OTHER_ID)).toEqual([]);
    expect(store.settings.tags).toEqual([]);
    expect((mock.store[videoSettingsKey(VIDEO_ID)] as { tags: string[] }).tags).toEqual([TAG]);
  });

  it("adds a known tag from the suggestions", async () => {
    const node = row(VIDEO_ID, []);
    openEditor(node);
    const option = node.querySelector<HTMLElement>(".ytloop-tag-option");
    expect(option?.textContent).toBe(KNOWN_TAG);
    option?.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
    await flushAsync();

    expect(savedTags(mock, VIDEO_ID)).toEqual([KNOWN_TAG]);
  });

  it("takes a tag off that video", async () => {
    mock.store[SAVED_LIST_KEY] = [entry(VIDEO_ID, [KNOWN_TAG]), entry(OTHER_ID, [])];
    const node = row(VIDEO_ID, [KNOWN_TAG]);
    node.querySelector<HTMLElement>(".ytloop-tag-remove")?.click();
    await flushAsync();

    expect(savedTags(mock, VIDEO_ID)).toEqual([]);
  });

  it("keeps a click inside the tag row from loading the video", () => {
    let loaded = false;
    const card = document.createElement("div");
    card.addEventListener("click", () => {
      loaded = true;
    });
    document.body.appendChild(card);
    card.appendChild(savedTagsRow(VIDEO_ID, [KNOWN_TAG]));

    card.querySelector<HTMLElement>(".ytloop-tag-add")?.click();
    expect(loaded).toBe(false);
  });
});
