import { DRAWER_HANDLE_ID, setSideDrawerOpen } from "../src/ui";

import { demoItems } from "./demoData";
import { installStorageMock, readStored, writeStored } from "./storageMock";

const WATCH_PATH = "/watch?v=playground";
const SAMPLE_VIDEO_URL = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";
const DARK_ATTRIBUTE = "dark";
const DARK_PREFERENCE_KEY = "ytloop-playground:dark";
const DEMO_STAMP_KEY = "ytloop-playground:demo";
const DEMO_STAMP = "2.24.0";
const DRAWER_WAIT_TRIES = 40;
const DRAWER_WAIT_MS = 50;

if (!location.pathname.startsWith("/watch")) history.replaceState(null, "", WATCH_PATH);

installStorageMock();

const seedDemoData = (): void => {
  writeStored(demoItems());
  localStorage.setItem(DEMO_STAMP_KEY, DEMO_STAMP);
};

const isSeeded = (): boolean =>
  localStorage.getItem(DEMO_STAMP_KEY) === DEMO_STAMP && Object.keys(readStored()).length > 0;

if (!isSeeded()) seedDemoData();

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

document.querySelector("#pg-demo")?.addEventListener("click", () => {
  seedDemoData();
  location.reload();
});

await import("../src/content");

function openPracticeWhenReady(tries = 0): void {
  if (document.getElementById(DRAWER_HANDLE_ID)) {
    setSideDrawerOpen(true);
    return;
  }
  if (tries < DRAWER_WAIT_TRIES)
    setTimeout(() => {
      openPracticeWhenReady(tries + 1);
    }, DRAWER_WAIT_MS);
}

openPracticeWhenReady();
