import { getVideoElement } from "../youtube";

import { onTimeUpdate } from "./loop";
import { updateMarkers } from "./markers";
import { markPaused, markResumed } from "./practice";
import { adoptVideoSpeed, onRateChange } from "./speed";
import { notify, store } from "./store";

const onMediaLoaded = (): void => {
  adoptVideoSpeed();
  updateMarkers();
};

const onPlay = (): void => {
  markResumed();
  notify("playState");
};

const onPause = (): void => {
  markPaused();
  notify("playState");
};

export function attachVideo(): void {
  const video = getVideoElement();
  if (!video || video === store.video) return;
  store.video = video;
  adoptVideoSpeed();
  video.addEventListener("timeupdate", onTimeUpdate);
  video.addEventListener("loadedmetadata", onMediaLoaded);
  video.addEventListener("play", onPlay);
  video.addEventListener("pause", onPause);
  video.addEventListener("ratechange", onRateChange);
}

export const isVideoPlaying = (): boolean => store.video != null && !store.video.paused;
