// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { loadGlobal, store } from "../player";
import { installChromeMock, uninstallChromeMock } from "../testing/chromeMock";

import { clearTagFilter, renderTagFilter, selectedTags } from "./drawerTags";
import { mountPanel, unmountPanel } from "./panel";
import { ids } from "./panelTemplate";

const VIDEO_ID = "tagged-video";
const TAG = "jazz";
const SETTLE_MS = 10;
const ENTER_KEY = "Enter";
const ESCAPE_KEY = "Escape";

const clickById = (id: string): void => {
  document.getElementById(id)?.click();
};

const clickOne = (selector: string): void => {
  const node = document.querySelector(selector);
  if (!(node instanceof HTMLElement)) throw new Error(`Missing ${selector}`);
  node.click();
};

const tagInput = (): HTMLInputElement => {
  const input = document.getElementById(ids.tagInput);
  if (!(input instanceof HTMLInputElement)) throw new Error("no tag input");
  return input;
};

const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, SETTLE_MS));

const renameInput = (): HTMLInputElement => {
  const input = document.querySelector("#ytloop-panel .ytloop-tag-rename");
  if (!(input instanceof HTMLInputElement)) throw new Error("Missing rename field");
  return input;
};

const press = (input: HTMLInputElement, key: string): void => {
  input.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
};

async function typeTag(name: string): Promise<void> {
  const input = tagInput();
  input.value = name;
  press(input, ENTER_KEY);
  await settle();
}

beforeEach(async () => {
  installChromeMock();
  store.videoId = VIDEO_ID;
  store.tags = [];
  store.settings.tags = [];
  await loadGlobal();
  mountPanel();
});

afterEach(() => {
  unmountPanel();
  clearTagFilter();
  uninstallChromeMock();
  document.body.innerHTML = "";
});

describe("tagging a video from the panel", () => {
  it("puts a new tag on the video and shows it as a chip", async () => {
    await typeTag(TAG);
    expect(store.settings.tags).toEqual([TAG]);
    expect(store.tags.map((tag) => tag.name)).toEqual([TAG]);
    const chip = document.querySelector("#ytloop-panel .ytloop-tag");
    expect(chip?.textContent).toContain(TAG);
    expect(chip?.getAttribute("style")).toContain("--ytloop-tag-hue");
  });

  it("offers the tag in the drawer filter and remembers the choice", async () => {
    await typeTag(TAG);
    const row = document.createElement("div");
    renderTagFilter(row, () => undefined);
    const chip = row.querySelector(".ytloop-tag");
    expect(chip).not.toBeNull();
    (chip as HTMLElement).click();
    expect(selectedTags()).toEqual([TAG]);
  });
});

describe("reusing and renaming tags", () => {
  const OTHER = "dorian";

  it("suggests a known tag under the field and adds it on click", async () => {
    await typeTag(TAG);
    await typeTag(OTHER);
    store.settings.tags = [];
    clickById(ids.tagAdd);
    tagInput().value = TAG.slice(0, 2);
    tagInput().dispatchEvent(new Event("input"));
    const options = [...document.querySelectorAll("#ytloop-panel .ytloop-tag-option")];
    expect(options.map((option) => option.textContent)).toEqual([TAG]);
    options[0]?.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
    await settle();
    expect(store.settings.tags).toEqual([TAG]);
  });

  it("keeps the old name when the rename is cancelled", async () => {
    await typeTag(TAG);
    clickOne("#ytloop-panel .ytloop-tag-name");
    const input = renameInput();
    input.value = OTHER;
    press(input, ESCAPE_KEY);
    await settle();
    expect(store.settings.tags).toEqual([TAG]);
  });

  it("renames a tag everywhere without changing its colour", async () => {
    await typeTag(TAG);
    const hue = store.tags[0]?.hue;
    clickOne("#ytloop-panel .ytloop-tag-name");
    const input = renameInput();
    input.value = OTHER;
    press(input, ENTER_KEY);
    await settle();
    expect(store.tags).toEqual([{ name: OTHER, hue }]);
    expect(store.settings.tags).toEqual([OTHER]);
  });
});

describe("closing the tag editor", () => {
  it("adds what was typed when the field loses focus", async () => {
    clickById(ids.tagAdd);
    tagInput().value = TAG;
    tagInput().dispatchEvent(new FocusEvent("blur"));
    await settle();
    expect(store.settings.tags).toEqual([TAG]);
  });
});
