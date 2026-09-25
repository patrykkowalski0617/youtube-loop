import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { defaultVideoSettings, type SavedEntry } from "../core";
import { type ChromeMock, installChromeMock, uninstallChromeMock } from "../testing/chromeMock";

import { SAVED_LIST_KEY, SYNC_META_KEY, videoSettingsKey, videoStatsKey } from "./keys";
import { loadSyncMeta } from "./localMirror";
import {
  loadSavedList,
  loadVideoSettings,
  removeSavedEntry,
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

describe("removeSavedEntry", () => {
  const PLAYED_SECONDS = 30;
  const SYNCED_AT = 5;
  let mock: ChromeMock;

  beforeEach(() => {
    mock = installChromeMock({
      [SAVED_LIST_KEY]: [saved(TAGGED_VIDEO, []), saved(OTHER_VIDEO, [])],
      [videoSettingsKey(TAGGED_VIDEO)]: {
        ...defaultVideoSettings(),
        fragments: [{ id: "f1", start: 1, end: 2, comment: "" }],
      },
      [videoStatsKey(TAGGED_VIDEO)]: { seconds: PLAYED_SECONDS },
      [SYNC_META_KEY]: { videos: { [TAGGED_VIDEO]: SYNCED_AT }, lastSyncedAt: SYNCED_AT },
    });
  });

  afterEach(() => {
    uninstallChromeMock();
  });

  it("drops the entry and leaves the other videos in the list", async () => {
    expect(await removeSavedEntry(TAGGED_VIDEO)).toEqual([saved(OTHER_VIDEO, [])]);
  });

  it("deletes the settings and the practice stats of that video", async () => {
    await removeSavedEntry(TAGGED_VIDEO);
    expect(videoSettingsKey(TAGGED_VIDEO) in mock.store).toBe(false);
    expect(videoStatsKey(TAGGED_VIDEO) in mock.store).toBe(false);
  });

  it("records the removal so the cloud copy cannot bring it back", async () => {
    await removeSavedEntry(TAGGED_VIDEO);
    const meta = await loadSyncMeta();
    expect(meta.removed).toEqual([TAGGED_VIDEO]);
    expect(meta.videos).toEqual({});
  });
});
