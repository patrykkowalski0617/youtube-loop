const VIDEO_SELECTOR =
  "#movie_player video.html5-main-video, video.html5-main-video, #movie_player video";
const TITLE_SELECTOR =
  "ytd-watch-metadata #title h1, #title h1.ytd-watch-metadata, h1.ytd-watch-metadata";
const DOCUMENT_TITLE_SUFFIX = /\s*-\s*YouTube\s*$/;
const WATCH_PATH = "/watch";
const WATCH_URL = "https://www.youtube.com/watch?v=";
const VIDEO_ID_PARAM = "v";

export const PROGRESS_BAR_SELECTOR = ".ytp-progress-bar";
const PLAYER_SELECTOR = "#movie_player, .html5-video-player";
export const RIGHT_CONTROLS_SELECTOR = ".ytp-right-controls";
export const NAVIGATE_FINISH_EVENT = "yt-navigate-finish";

export const getVideoElement = (): HTMLVideoElement | null =>
  document.querySelector<HTMLVideoElement>(VIDEO_SELECTOR);

export const getPlayerElement = (): HTMLElement | null =>
  document.querySelector<HTMLElement>(PLAYER_SELECTOR);

export const isWatchPage = (): boolean => location.pathname.startsWith(WATCH_PATH);

export function getVideoId(): string | null {
  try {
    return new URL(location.href).searchParams.get(VIDEO_ID_PARAM);
  } catch {
    return null;
  }
}

export function getVideoTitle(fallback: string): string {
  const heading = document.querySelector(TITLE_SELECTOR)?.textContent.trim() ?? "";
  if (heading) return heading;
  const fromDocument = document.title.replace(DOCUMENT_TITLE_SUFFIX, "").trim();
  return fromDocument || fallback;
}

export const watchUrl = (videoId: string): string => WATCH_URL + encodeURIComponent(videoId);
