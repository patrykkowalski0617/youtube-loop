import { describe, expect, it } from "vitest";

import { defaultVideoSettings, emptyStats, type SavedEntry } from "../core";

import {
  fromRemoteVideo,
  type LocalVideo,
  mergeSavedList,
  pickWinner,
  savedListChangedIds,
  toRemoteVideo,
} from "./merge";

const VIDEO_ID = "abc123";
const NEWER = 2000;
const OLDER = 1000;

const savedEntry = (over: Partial<SavedEntry> = {}): SavedEntry => ({
  ...defaultVideoSettings(),
  videoId: VIDEO_ID,
  title: "Title",
  savedAt: OLDER,
  ...over,
});

const localVideo = (over: Partial<LocalVideo> = {}): LocalVideo => ({
  videoId: VIDEO_ID,
  settings: { ...defaultVideoSettings(), start: 10, end: 20 },
  stats: { ...emptyStats(), seconds: 42 },
  saved: null,
  ...over,
});

describe("pickWinner", () => {
  it("takes the side with the newer timestamp", () => {
    expect(pickWinner(NEWER, OLDER)).toBe("local");
    expect(pickWinner(OLDER, NEWER)).toBe("remote");
  });

  it("prefers remote on a tie, so a pull is idempotent", () => {
    expect(pickWinner(OLDER, OLDER)).toBe("remote");
  });

  it("falls back to whichever side exists", () => {
    expect(pickWinner(OLDER, null)).toBe("local");
    expect(pickWinner(null, OLDER)).toBe("remote");
  });
});

describe("toRemoteVideo / fromRemoteVideo", () => {
  it("round-trips settings and stats", () => {
    const local = localVideo();
    const back = fromRemoteVideo(VIDEO_ID, toRemoteVideo(local, NEWER));
    expect(back.settings).toEqual(local.settings);
    expect(back.stats).toEqual(local.stats);
    expect(back.updatedAt).toBe(NEWER);
  });

  it("carries the saved-list entry only when the video was saved", () => {
    expect(fromRemoteVideo(VIDEO_ID, toRemoteVideo(localVideo(), NEWER)).saved).toBeNull();
    const withSaved = localVideo({ saved: savedEntry() });
    const back = fromRemoteVideo(VIDEO_ID, toRemoteVideo(withSaved, NEWER));
    expect(back.saved).toMatchObject({ videoId: VIDEO_ID, title: "Title", savedAt: OLDER });
  });

  it("survives a malformed or empty remote document", () => {
    const back = fromRemoteVideo(VIDEO_ID, null);
    expect(back.settings).toEqual(defaultVideoSettings());
    expect(back.stats).toEqual(emptyStats());
    expect(back.updatedAt).toBe(0);
  });

  it("drops undefined so Firestore accepts the document", () => {
    const doc = toRemoteVideo(localVideo(), NEWER);
    expect(Object.values(doc)).not.toContain(undefined);
  });
});

describe("mergeSavedList", () => {
  it("keeps the newer entry per video and orders newest first", () => {
    const merged = mergeSavedList(
      [savedEntry({ title: "old" }), savedEntry({ videoId: "other", savedAt: NEWER })],
      [savedEntry({ title: "new", savedAt: NEWER })],
    );
    expect(merged.map((e) => e.title)).toEqual(["new", "Title"]);
    expect(merged).toHaveLength(2);
  });

  it("adds entries that exist only on one side", () => {
    const merged = mergeSavedList([], [savedEntry()]);
    expect(merged).toHaveLength(1);
  });
});

describe("savedListChangedIds", () => {
  it("reports a newly saved video", () => {
    expect(savedListChangedIds([], [savedEntry()])).toEqual([VIDEO_ID]);
  });

  it("reports a re-saved video and a renamed one", () => {
    expect(savedListChangedIds([savedEntry()], [savedEntry({ savedAt: NEWER })])).toEqual([
      VIDEO_ID,
    ]);
    expect(savedListChangedIds([savedEntry()], [savedEntry({ title: "Renamed" })])).toEqual([
      VIDEO_ID,
    ]);
  });

  it("reports a removed video, so the cloud copy stops resurrecting it", () => {
    expect(savedListChangedIds([savedEntry()], [])).toEqual([VIDEO_ID]);
  });

  it("stays quiet when nothing about the entry changed", () => {
    expect(savedListChangedIds([savedEntry()], [savedEntry()])).toEqual([]);
  });

  it("ignores malformed values", () => {
    expect(savedListChangedIds(undefined, "nope")).toEqual([]);
  });
});
