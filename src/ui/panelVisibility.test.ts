// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { defaultGlobalSettings } from "../core";
import { store } from "../player";
import { installChromeMock, uninstallChromeMock } from "../testing/chromeMock";

import { PANEL_ID, PLAYER_BUTTON_ID } from "./dom";
import {
  applyStoredPanelPosition,
  autoOpenPanel,
  isPanelVisible,
  setPanelVisible,
} from "./panelVisibility";

const WIDE = 1000;
const TALL = 800;
const PANEL_WIDTH = 300;
const PANEL_HEIGHT = 400;
const FAR_CORNER = 1;

const resize = (width: number, height: number): void => {
  window.innerWidth = width;
  window.innerHeight = height;
};

function panel(): HTMLElement {
  const node = document.createElement("div");
  node.id = PANEL_ID;
  Object.defineProperty(node, "offsetWidth", { value: PANEL_WIDTH, configurable: true });
  Object.defineProperty(node, "offsetHeight", { value: PANEL_HEIGHT, configurable: true });
  document.body.appendChild(node);
  return node;
}

describe("applyStoredPanelPosition", () => {
  beforeEach(() => {
    installChromeMock();
    resize(WIDE, TALL);
    store.global = { ...defaultGlobalSettings(), panelX: FAR_CORNER, panelY: FAR_CORNER };
  });

  afterEach(() => {
    document.body.innerHTML = "";
    uninstallChromeMock();
  });

  it("keeps the panel inside after the window shrinks", () => {
    const node = panel();
    applyStoredPanelPosition();
    expect(node.style.left).toBe(`${WIDE - PANEL_WIDTH}px`);

    resize(PANEL_WIDTH + 100, PANEL_HEIGHT + 50);
    applyStoredPanelPosition();
    expect(node.style.left).toBe("100px");
    expect(node.style.top).toBe("50px");
  });

  it("pins it to the corner when the window is smaller than the panel", () => {
    const node = panel();
    resize(PANEL_WIDTH / 2, PANEL_HEIGHT / 2);
    applyStoredPanelPosition();
    expect(node.style.left).toBe("0px");
    expect(node.style.top).toBe("0px");
  });

  it("leaves a panel that was never dragged to the stylesheet", () => {
    const node = panel();
    store.global = defaultGlobalSettings();
    applyStoredPanelPosition();
    expect(node.style.left).toBe("");
  });
});

const VIDEO_ID = "video";
const OTHER_VIDEO_ID = "other-video";

describe("autoOpenPanel", () => {
  beforeEach(() => {
    installChromeMock();
    store.global = defaultGlobalSettings();
    panel();
  });

  afterEach(() => {
    document.body.innerHTML = "";
    uninstallChromeMock();
  });

  it("shows the panel on a video that has fragments and hides it on one without", () => {
    autoOpenPanel(VIDEO_ID, true);
    expect(isPanelVisible()).toBe(true);
    autoOpenPanel(OTHER_VIDEO_ID, false);
    expect(isPanelVisible()).toBe(false);
  });

  it("leaves a manual close alone while the same video stays open", () => {
    autoOpenPanel(VIDEO_ID, true);
    setPanelVisible(false);
    autoOpenPanel(VIDEO_ID, true);
    expect(isPanelVisible()).toBe(false);
  });

  it("decides again for a panel that was mounted anew", () => {
    autoOpenPanel(VIDEO_ID, true);
    setPanelVisible(false);
    document.body.innerHTML = "";
    panel();
    autoOpenPanel(VIDEO_ID, true);
    expect(isPanelVisible()).toBe(true);
  });

  it("marks the player button while the panel shows", () => {
    const button = document.createElement("button");
    button.id = PLAYER_BUTTON_ID;
    document.body.appendChild(button);
    autoOpenPanel(VIDEO_ID, true);
    expect(button.classList.contains("ytloop-active")).toBe(true);
  });
});
