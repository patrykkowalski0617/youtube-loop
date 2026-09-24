// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { defaultGlobalSettings } from "../core";
import { store } from "../player";
import { installChromeMock, uninstallChromeMock } from "../testing/chromeMock";

import { PANEL_ID } from "./dom";
import { applyStoredPanelPosition } from "./panelVisibility";

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
