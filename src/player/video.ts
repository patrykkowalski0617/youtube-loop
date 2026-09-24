import { getVideoElement } from "../youtube";

import { onTimeUpdate } from "./loop";
import { updateMarkers } from "./markers";
import { adoptVideoSpeed, onRateChange } from "./speed";
import { notify, store } from "./store";

const onMediaLoaded = (): void => {
  adoptVideoSpeed();
  updateMarkers();
};

const notifyPlayState = (): void => {
  notify("playState");
};

export function attachVideo(): void {
  const video = getVideoElement();
  if (!video || video === store.video) return;
  store.video = video;
  adoptVideoSpeed();
  video.addEventListener("timeupdate", onTimeUpdate);
  video.addEventListener("loadedmetadata", onMediaLoaded);
  video.addEventListener("play", notifyPlayState);
  video.addEventListener("pause", notifyPlayState);
  video.addEventListener("ratechange", onRateChange);
}

export const isVideoPlaying = (): boolean => store.video != null && !store.video.paused;
