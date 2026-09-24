// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { defaultVideoSettings, type SavedEntry } from "../core";
import { SAVED_LIST_KEY } from "../storage";
import { type ChromeMock, installChromeMock, uninstallChromeMock } from "../testing/chromeMock";
import { flushAsync } from "../testing/flush";

import { clearPendingRemovals, isPendingRemoval, startRemoval, undoRow } from "./savedUndo";

const VIDEO_ID = "doomed-video";
const UNDONE_ID = "undone-video";
const REBUILT_ID = "rebuilt-video";
const DROPPED_ID = "dropped-video";
const KEPT_ID = "kept-video";
const ALL_IDS = [VIDEO_ID, UNDONE_ID, REBUILT_ID, DROPPED_ID, KEPT_ID];
const UNDO_SECONDS = 5;
const TICK_MS = 1000;

const entry = (videoId: string): SavedEntry => ({
  ...defaultVideoSettings(),
  videoId,
  title: videoId,
  savedAt: 0,
});

const savedIds = (mock: ChromeMock): string[] =>
  (mock.store[SAVED_LIST_KEY] as SavedEntry[]).map((e) => e.videoId);

const runSeconds = async (count: number): Promise<void> => {
  for (let i = 0; i < count; i += 1) {
    vi.advanceTimersByTime(TICK_MS);
    await flushAsync();
  }
};

let mock: ChromeMock;

describe("pending removal", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mock = installChromeMock({ [SAVED_LIST_KEY]: ALL_IDS.map(entry) });
  });

  afterEach(() => {
    clearPendingRemovals();
    vi.useRealTimers();
    uninstallChromeMock();
  });

  it("counts down from the full window and removes the entry when it runs out", async () => {
    startRemoval(VIDEO_ID);
    const row = undoRow(VIDEO_ID, () => undefined);
    expect(row.querySelector(".ytloop-saved-undo-left")?.textContent).toBe("Removing in 5s");

    await runSeconds(1);
    expect(row.querySelector(".ytloop-saved-undo-left")?.textContent).toBe("Removing in 4s");
    expect(savedIds(mock)).toEqual(ALL_IDS);

    await runSeconds(UNDO_SECONDS - 1);
    expect(savedIds(mock)).not.toContain(VIDEO_ID);
    expect(isPendingRemoval(VIDEO_ID)).toBe(false);
  });

  it("keeps the entry when undo is clicked", async () => {
    startRemoval(UNDONE_ID);
    let undone = false;
    const row = undoRow(UNDONE_ID, () => {
      undone = true;
    });
    row.querySelector<HTMLElement>(".ytloop-saved-undo-btn")?.click();

    expect(undone).toBe(true);
    expect(isPendingRemoval(UNDONE_ID)).toBe(false);
    await runSeconds(UNDO_SECONDS + 1);
    expect(savedIds(mock)).toEqual(ALL_IDS);
  });

  it("resumes the countdown where it stood when the row is rebuilt", async () => {
    startRemoval(REBUILT_ID);
    undoRow(REBUILT_ID, () => undefined);
    await runSeconds(2);
    const rebuilt = undoRow(REBUILT_ID, () => undefined);
    expect(rebuilt.querySelector(".ytloop-saved-undo-left")?.textContent).toBe("Removing in 3s");
  });

  it("keeps every pending entry when the drawer goes away", async () => {
    startRemoval(DROPPED_ID);
    clearPendingRemovals();
    expect(isPendingRemoval(DROPPED_ID)).toBe(false);
    await runSeconds(UNDO_SECONDS + 1);
    expect(savedIds(mock)).toEqual(ALL_IDS);
  });
});
