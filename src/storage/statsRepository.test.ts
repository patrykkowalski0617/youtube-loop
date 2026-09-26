import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { emptyStats } from "../core";
import { type ChromeMock, installChromeMock, uninstallChromeMock } from "../testing/chromeMock";

import { SAVED_LIST_KEY, videoStatsKey } from "./keys";
import {
  loadAllVideoStats,
  loadPlayedSummaries,
  loadVideoStats,
  saveVideoStats,
} from "./statsRepository";

const FIRST = "first-video";
const SECOND = "second-video";
const PLAYED_SECONDS = 90;
const LAST_PLAYED_AT = 1700000000000;

let mock: ChromeMock;

describe("the statistics repository", () => {
  beforeEach(() => {
    mock = installChromeMock({
      [videoStatsKey(FIRST)]: {
        ...emptyStats(),
        seconds: PLAYED_SECONDS,
        lastPlayedAt: LAST_PLAYED_AT,
      },
      [SAVED_LIST_KEY]: [{ videoId: FIRST, title: "A song", tags: ["jazz"] }],
    });
  });

  afterEach(() => {
    uninstallChromeMock();
  });

  it("reads a stored record back through normalization", async () => {
    expect((await loadVideoStats(FIRST)).seconds).toBe(PLAYED_SECONDS);
    expect((await loadVideoStats("missing")).seconds).toBe(0);
  });

  it("writes a record under the video's own key", async () => {
    await saveVideoStats(SECOND, { ...emptyStats(), reps: 3 });
    expect(mock.store[videoStatsKey(SECOND)]).toMatchObject({ reps: 3 });
  });

  it("summarises the play time of several videos at once", async () => {
    const played = await loadPlayedSummaries([FIRST, SECOND]);
    expect(played[FIRST]).toEqual({ seconds: PLAYED_SECONDS, lastPlayedAt: LAST_PLAYED_AT });
    expect(played[SECOND]).toEqual({ seconds: 0, lastPlayedAt: 0 });
  });

  it("gathers every tracked video with the title and tags of its saved entry", async () => {
    await saveVideoStats(SECOND, { ...emptyStats(), seconds: 10 });
    const entries = await loadAllVideoStats();
    expect(entries.map((e) => e.videoId).sort()).toEqual([FIRST, SECOND].sort());
    const first = entries.find((e) => e.videoId === FIRST);
    expect(first?.title).toBe("A song");
    expect(first?.tags).toEqual(["jazz"]);
  });

  it("falls back on the video id when nothing was saved for it", async () => {
    await saveVideoStats(SECOND, { ...emptyStats(), seconds: 10 });
    const second = (await loadAllVideoStats()).find((e) => e.videoId === SECOND);
    expect(second?.title).toBe(SECOND);
    expect(second?.tags).toEqual([]);
  });
});
