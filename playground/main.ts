import { installStorageMock } from "./storageMock";

const WATCH_PATH = "/watch?v=playground";
const SAMPLE_VIDEO_URL = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";
const DARK_ATTRIBUTE = "dark";
const DARK_PREFERENCE_KEY = "ytloop-playground:dark";

if (!location.pathname.startsWith("/watch")) history.replaceState(null, "", WATCH_PATH);

installStorageMock();

const video = document.querySelector<HTMLVideoElement>("video.html5-main-video");
if (video) video.src = SAMPLE_VIDEO_URL;

const dark = document.querySelector<HTMLInputElement>("#pg-dark");
const applyDark = (on: boolean): void => {
  document.documentElement.toggleAttribute(DARK_ATTRIBUTE, on);
  localStorage.setItem(DARK_PREFERENCE_KEY, String(on));
};
if (dark) {
  dark.checked = localStorage.getItem(DARK_PREFERENCE_KEY) === "true";
  applyDark(dark.checked);
  dark.addEventListener("change", () => {
    applyDark(dark.checked);
  });
}

document.querySelector("#pg-reset")?.addEventListener("click", () => {
  localStorage.clear();
  location.reload();
});

await import("../src/content");
