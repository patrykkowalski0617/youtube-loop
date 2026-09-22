import {
  attachVideo,
  loadForVideo,
  loadGlobal,
  removeMarkers,
  store,
  subscribe,
  toggleLoopPlayback,
  updateMarkers,
} from "../player";
import { isSyncConfigured, messaging, SYNC_MESSAGE, type SyncMessage } from "../sync";
import {
  applyStoredFolds,
  applyStoredPanelPosition,
  injectPlayerButton,
  isEditableTarget,
  isEditingNote,
  mountDrawer,
  mountPanel,
  PANEL_ID,
  removeTimeline,
  setPanelVisible,
  syncPanel,
  unmountDrawer,
  unmountPanel,
  updateTimeline,
} from "../ui";
import { getVideoElement, getVideoId, isWatchPage, NAVIGATE_FINISH_EVENT } from "../youtube";

import "../styles/content.css";

const NAVIGATION_SETTLE_MS = 300;
const MARKER_TICK_MS = 500;
const SPACE_CODE = "Space";
const SPACE_KEY = " ";

function leaveWatchPage(): void {
  unmountPanel();
  removeMarkers();
  removeTimeline();
  unmountDrawer();
}

async function init(): Promise<void> {
  if (!isWatchPage()) {
    leaveWatchPage();
    return;
  }
  attachVideo();
  mountPanel();
  injectPlayerButton();
  mountDrawer();
  const globalReady = loadGlobal().then(() => {
    applyStoredPanelPosition();
    applyStoredFolds();
    setPanelVisible(store.global.panelOpen, false);
  });
  await Promise.all([globalReady, loadForVideo(getVideoId())]);
  syncPanel("saved");
}

function onNavigate(): void {
  setTimeout(() => void init(), NAVIGATION_SETTLE_MS);
}

function onKeydown(e: KeyboardEvent): void {
  if (e.code !== SPACE_CODE && e.key !== SPACE_KEY) return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (!isWatchPage() || isEditingNote() || isEditableTarget(e.target)) return;
  if (!store.video || !store.settings.enabled || store.settings.start == null) return;
  e.preventDefault();
  e.stopImmediatePropagation();
  toggleLoopPlayback();
}

function watchPulledData(): void {
  const runtime = messaging();
  if (!isSyncConfigured || !runtime) return;
  runtime.onMessage.addListener((message: unknown) => {
    if ((message as SyncMessage | undefined)?.type !== SYNC_MESSAGE.pulled) return;
    if (!isWatchPage()) return;
    void loadForVideo(getVideoId()).then(() => {
      syncPanel("saved");
    });
  });
}

function markerTick(): void {
  if (isWatchPage()) {
    if (store.settings.enabled && document.getElementById(PANEL_ID)) updateMarkers();
    updateTimeline();
  }
  requestAnimationFrame(() => setTimeout(markerTick, MARKER_TICK_MS));
}

function bootstrap(): void {
  subscribe((kind) => {
    if (kind !== "settings" && kind !== "fragments") return;
    updateMarkers();
    updateTimeline();
  });
  window.addEventListener(NAVIGATE_FINISH_EVENT, onNavigate);
  document.addEventListener(NAVIGATE_FINISH_EVENT, onNavigate);
  window.addEventListener("keydown", onKeydown, true);
  watchPulledData();
  const observer = new MutationObserver(() => {
    if (!isWatchPage()) return;
    if (!getVideoElement() || !document.getElementById(PANEL_ID)) void init();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  markerTick();
  void init();
}

bootstrap();
