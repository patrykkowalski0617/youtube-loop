import { getVideoElement } from "../youtube";

import { onTimeUpdate } from "./loop";
import { updateMarkers } from "./markers";
import { restoreSpeedAfterExternalChange } from "./speed";
import { notify, store } from "./store";

const notifyPlayState = (): void => {
  notify("playState");
};

export function attachVideo(): void {
  const video = getVideoElement();
  if (!video || video === store.video) return;
  store.video = video;
  video.addEventListener("timeupdate", onTimeUpdate);
  video.addEventListener("loadedmetadata", updateMarkers);
  video.addEventListener("play", notifyPlayState);
  video.addEventListener("pause", notifyPlayState);
  video.addEventListener("ratechange", restoreSpeedAfterExternalChange);
}

export const isVideoPlaying = (): boolean => store.video != null && !store.video.paused;
