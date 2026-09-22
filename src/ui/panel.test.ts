// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { attachVideo, loadForVideo, loadGlobal, store } from "../player";

import { byId, inputById } from "./dom";
import { mountPanel, unmountPanel } from "./panel";
import { ids } from "./panelTemplate";

const VIDEO_ID = "test-video";
const START = 10;
const END = 20;
const DURATION = 60;
const TAIL_MS = 1000;

const calls = { play: 0, pause: 0 };

function mountVideo(): HTMLVideoElement {
  calls.play = 0;
  calls.pause = 0;
  const player = document.createElement("div");
  player.id = "movie_player";
  const video = document.createElement("video");
  video.className = "html5-main-video";
  Object.defineProperty(video, "duration", { value: DURATION, configurable: true });
  let paused = true;
  Object.defineProperty(video, "paused", { get: () => paused, configurable: true });
  video.play = () => {
    paused = false;
    calls.play += 1;
    return Promise.resolve();
  };
  video.pause = () => {
    paused = true;
    calls.pause += 1;
  };
  player.appendChild(video);
  document.body.appendChild(player);
  return video;
}

describe("panel", () => {
  let video: HTMLVideoElement;
  let panel: HTMLElement;

  beforeEach(async () => {
    vi.useFakeTimers();
    document.body.innerHTML = "";
    video = mountVideo();
    attachVideo();
    await loadGlobal();
    await loadForVideo(VIDEO_ID);
    const mounted = mountPanel();
    if (!mounted) throw new Error("panel did not mount");
    panel = mounted;
  });

  afterEach(() => {
    unmountPanel();
    vi.useRealTimers();
  });

  it("captures start and end from the video and enables the loop", () => {
    video.currentTime = START;
    byId(panel, ids.setStart).click();
    video.currentTime = END;
    byId(panel, ids.setEnd).click();
    expect(store.settings).toMatchObject({ start: START, end: END });
    expect(inputById(panel, ids.start).value).toBe("0:10");
    expect(inputById(panel, ids.end).value).toBe("0:20");

    const enable = inputById(panel, ids.enable);
    enable.checked = true;
    enable.dispatchEvent(new Event("change"));
    expect(store.settings.enabled).toBe(true);
    expect(panel.querySelector(`#${ids.status}`)?.textContent).toContain("Looping");
  });

  it("pauses for the gap at the end of the segment, then restarts from the start", () => {
    store.settings.start = START;
    store.settings.end = END;
    store.settings.enabled = true;
    video.currentTime = END;
    video.dispatchEvent(new Event("timeupdate"));
    expect(calls.pause).toBe(1);
    expect(store.inTail).toBe(true);
    expect(store.stats.seconds).toBe(END - START);

    vi.advanceTimersByTime(TAIL_MS);
    expect(store.inTail).toBe(false);
    expect(video.currentTime).toBe(START);
    expect(calls.play).toBe(1);
  });

  it("saves the marked range as a fragment", () => {
    video.currentTime = START;
    byId(panel, ids.setStart).click();
    video.currentTime = END;
    byId(panel, ids.setEnd).click();
    byId(panel, ids.fragAdd).click();
    expect(store.settings.fragments).toEqual([
      expect.objectContaining({ start: START, end: END, comment: "" }),
    ]);
  });

  it("offers the add button only once both ends are marked", () => {
    const add = byId(panel, ids.fragAdd) as HTMLButtonElement;
    expect(add.disabled).toBe(true);
    video.currentTime = START;
    byId(panel, ids.setStart).click();
    video.currentTime = END;
    byId(panel, ids.setEnd).click();
    expect(add.disabled).toBe(false);
  });
});
