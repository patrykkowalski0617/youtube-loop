// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { defaultVideoSettings, normalizeFragments } from "../core";
import { store } from "../player";
import { installChromeMock, uninstallChromeMock } from "../testing/chromeMock";
import { flushAsync } from "../testing/flush";

import { byId } from "./dom";
import { renderFragments } from "./fragmentsList";

const NOTED = { id: "a", start: 10, end: 20, comment: "bend on the b string" };
const PLAIN = { id: "b", start: 30, end: 40, comment: "" };

let list: HTMLElement;

const items = (): HTMLElement[] => [...list.querySelectorAll<HTMLElement>(".ytloop-frag-item")];

function chip(index: number): HTMLElement {
  const item = items()[index];
  if (!item) throw new Error(`No chip at ${index}`);
  return item;
}

const text = (index: number, selector: string): string | undefined =>
  chip(index).querySelector<HTMLElement>(selector)?.textContent ?? undefined;

function editor(index: number): HTMLInputElement {
  const input = chip(index).querySelector<HTMLInputElement>(".ytloop-frag-input");
  if (!input) throw new Error("Editor is not open");
  return input;
}

const openNote = (index: number): void => {
  chip(index).querySelector<HTMLElement>(".ytloop-frag-note")?.click();
};

describe("fragment chips", () => {
  beforeEach(() => {
    installChromeMock();
    document.body.innerHTML = '<ul id="list"></ul>';
    list = byId(document, "list");
    store.videoId = "video";
    store.settings = { ...defaultVideoSettings(), fragments: normalizeFragments([NOTED, PLAIN]) };
  });

  afterEach(uninstallChromeMock);

  it("shows the note above the time", () => {
    renderFragments(list);
    expect(text(0, ".ytloop-frag-comment")).toBe(NOTED.comment);
    expect(text(0, ".ytloop-frag-time")).toBe("0:10 – 0:20");
    expect(chip(0).firstElementChild?.firstElementChild?.className).toBe("ytloop-frag-comment");
  });

  it("leaves the comment line out when there is no note", () => {
    renderFragments(list);
    expect(chip(1).querySelector(".ytloop-frag-comment")).toBeNull();
    expect(text(1, ".ytloop-frag-time")).toBe("0:30 – 0:40");
  });

  it("opens an editor seeded with the current note", () => {
    renderFragments(list);
    openNote(0);
    expect(editor(0).value).toBe(NOTED.comment);
    expect(document.activeElement).toBe(editor(0));
  });

  it("stores the note on Enter", async () => {
    renderFragments(list);
    openNote(1);
    const input = editor(1);
    input.value = "  slide up  ";
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await flushAsync();
    expect(store.settings.fragments[1]?.comment).toBe("slide up");
  });

  it("drops the edit on Escape", async () => {
    renderFragments(list);
    openNote(0);
    const input = editor(0);
    input.value = "discarded";
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await flushAsync();
    expect(store.settings.fragments[0]?.comment).toBe(NOTED.comment);
    expect(text(0, ".ytloop-frag-comment")).toBe(NOTED.comment);
  });

  it("keeps YouTube shortcuts out of the editor", () => {
    renderFragments(list);
    let reachedWindow = false;
    const spy = (): void => {
      reachedWindow = true;
    };
    window.addEventListener("keydown", spy);
    openNote(0);
    editor(0).dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    window.removeEventListener("keydown", spy);
    expect(reachedWindow).toBe(false);
  });
});

describe("sub-fragments", () => {
  const PARENT = { id: "p", start: 0, end: 60, comment: "whole chorus" };
  const FIRST = { id: "s1", start: 5, end: 10, comment: "" };
  const SECOND = { id: "s2", start: 20, end: 25, comment: "the bend" };

  beforeEach(() => {
    store.settings = {
      ...defaultVideoSettings(),
      fragments: normalizeFragments([SECOND, PARENT, FIRST]),
    };
    renderFragments(list);
  });

  it("renders a range contained by another as its sub", () => {
    const groups = list.querySelectorAll(":scope > .ytloop-frag-group");
    expect(groups).toHaveLength(1);
    expect(groups[0]?.querySelectorAll(".ytloop-frag-subs > .ytloop-frag-group")).toHaveLength(2);
  });

  it("puts the parent chip above its subs", () => {
    const group = list.querySelector(":scope > .ytloop-frag-group");
    expect(group?.firstElementChild?.className).toContain("ytloop-frag-item");
    expect(group?.lastElementChild?.className).toBe("ytloop-frag-subs");
    expect(group?.firstElementChild?.textContent).toContain("0:00 – 1:00");
  });

  it("orders subs by where they start", () => {
    const times = [...list.querySelectorAll(".ytloop-frag-subs .ytloop-frag-time")].map(
      (n) => n.textContent,
    );
    expect(times).toEqual(["0:05 – 0:10", "0:20 – 0:25"]);
  });

  it("gives a sub the same note and controls as a parent", () => {
    const sub = list.querySelectorAll(".ytloop-frag-subs .ytloop-frag-item")[1];
    expect(sub?.querySelector(".ytloop-frag-comment")?.textContent).toBe(SECOND.comment);
    expect(sub?.querySelector(".ytloop-frag-note")).not.toBeNull();
    expect(sub?.querySelector(".ytloop-frag-del")).not.toBeNull();
  });

  it("loads the sub range when a sub is clicked", () => {
    const sub = list.querySelectorAll<HTMLElement>(".ytloop-frag-subs .ytloop-frag-btn")[0];
    sub?.click();
    expect(store.settings.start).toBe(FIRST.start);
    expect(store.settings.end).toBe(FIRST.end);
  });
});
