import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { defaultVideoSettings, type SavedEntry } from "../core";
import { installChromeMock, uninstallChromeMock } from "../testing/chromeMock";

import { SAVED_LIST_KEY, videoSettingsKey } from "./keys";
import {
  loadSavedList,
  loadVideoSettings,
  renameTagEverywhere,
  saveEntryTags,
} from "./repositories";

const OTHER_VIDEO = "other-video";
const TAGGED_VIDEO = "tagged-video";
const OLD_NAME = "jazz";
const NEW_NAME = "modal jazz";

const saved = (videoId: string, tags: string[]): SavedEntry => ({
  ...defaultVideoSettings(),
  tags,
  videoId,
  title: videoId,
  savedAt: 0,
});

describe("renameTagEverywhere", () => {
  beforeEach(() => {
    installChromeMock({
      [videoSettingsKey(TAGGED_VIDEO)]: { ...defaultVideoSettings(), tags: [OLD_NAME, "blues"] },
      [videoSettingsKey(OTHER_VIDEO)]: { ...defaultVideoSettings(), tags: ["blues"] },
      [SAVED_LIST_KEY]: [saved(TAGGED_VIDEO, [OLD_NAME]), saved(OTHER_VIDEO, ["blues"])],
    });
  });

  afterEach(() => {
    uninstallChromeMock();
  });

  it("renames the tag on every video that carries it", async () => {
    await renameTagEverywhere(OLD_NAME, NEW_NAME);
    expect((await loadVideoSettings(TAGGED_VIDEO)).tags).toEqual([NEW_NAME, "blues"]);
    expect((await loadVideoSettings(OTHER_VIDEO)).tags).toEqual(["blues"]);
  });

  it("renames it in the saved list as well", async () => {
    await renameTagEverywhere(OLD_NAME, NEW_NAME);
    const list = await loadSavedList();
    expect(list.map((entry) => entry.tags)).toEqual([[NEW_NAME], ["blues"]]);
  });
});

describe("saveEntryTags", () => {
  beforeEach(() => {
    installChromeMock({
      [videoSettingsKey(TAGGED_VIDEO)]: { ...defaultVideoSettings(), tags: [OLD_NAME] },
      [SAVED_LIST_KEY]: [saved(TAGGED_VIDEO, [OLD_NAME]), saved(OTHER_VIDEO, [])],
    });
  });

  afterEach(() => {
    uninstallChromeMock();
  });

  it("writes the tags to the video settings and to the saved entry", async () => {
    await saveEntryTags(TAGGED_VIDEO, [NEW_NAME]);
    expect((await loadVideoSettings(TAGGED_VIDEO)).tags).toEqual([NEW_NAME]);
    expect((await loadSavedList()).map((entry) => entry.tags)).toEqual([[NEW_NAME], []]);
  });

  it("leaves other videos alone", async () => {
    await saveEntryTags(TAGGED_VIDEO, []);
    expect((await loadSavedList())[1]?.tags).toEqual([]);
    expect((await loadVideoSettings(OTHER_VIDEO)).tags).toEqual([]);
  });
});
