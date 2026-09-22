// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { store } from "../player";
import { installChromeMock, uninstallChromeMock } from "../testing/chromeMock";

import { byId } from "./dom";
import { enableDrag, placePanel } from "./drag";

const VIEWPORT_WIDTH = 1000;
const VIEWPORT_HEIGHT = 800;
const GRAB_X = 120;
const GRAB_Y = 40;

function setup(): { handle: HTMLElement; panel: HTMLElement } {
  document.body.innerHTML =
    '<div id="panel"><div id="handle"><button id="close"></button></div></div>';
  const panel = byId(document, "panel");
  const handle = byId(document, "handle");
  enableDrag(handle, panel);
  return { handle, panel };
}

const mouse = (target: EventTarget, type: string, x: number, y: number): void => {
  target.dispatchEvent(new MouseEvent(type, { clientX: x, clientY: y, bubbles: true }));
};

describe("placePanel", () => {
  it("pins the panel to the left and top corner", () => {
    document.body.innerHTML = '<div id="panel"></div>';
    const panel = byId(document, "panel");
    placePanel(panel, 10, 20);
    expect(panel.style.left).toBe("10px");
    expect(panel.style.top).toBe("20px");
    expect(panel.style.right).toBe("auto");
    expect(panel.style.bottom).toBe("auto");
  });
});

describe("enableDrag", () => {
  beforeEach(() => {
    installChromeMock();
    window.innerWidth = VIEWPORT_WIDTH;
    window.innerHeight = VIEWPORT_HEIGHT;
    store.global = { tail: 1, panelOpen: true, panelLeft: null, panelTop: null };
  });

  afterEach(uninstallChromeMock);

  it("moves the panel by the drag delta and remembers the position", () => {
    const { handle, panel } = setup();
    mouse(handle, "mousedown", GRAB_X, GRAB_Y);
    mouse(window, "mousemove", GRAB_X + 100, GRAB_Y + 60);
    expect(panel.style.left).toBe("100px");
    expect(panel.style.top).toBe("60px");
    expect(store.global.panelLeft).toBe(100);
    expect(store.global.panelTop).toBe(60);
  });

  it("keeps a sliver of the panel on screen", () => {
    const { handle, panel } = setup();
    mouse(handle, "mousedown", 0, 0);
    mouse(window, "mousemove", VIEWPORT_WIDTH * 2, VIEWPORT_HEIGHT * 2);
    expect(panel.style.left).toBe("940px");
    expect(panel.style.top).toBe("770px");
    mouse(window, "mousemove", -500, -500);
    expect(panel.style.left).toBe("0px");
    expect(panel.style.top).toBe("0px");
  });

  it("ignores a drag started on a control inside the header", () => {
    const { panel } = setup();
    const close = byId(document, "close");
    mouse(close, "mousedown", GRAB_X, GRAB_Y);
    mouse(window, "mousemove", GRAB_X + 100, GRAB_Y + 60);
    expect(panel.style.left).toBe("");
  });

  it("stops following the mouse after the button is released", () => {
    const { handle, panel } = setup();
    mouse(handle, "mousedown", GRAB_X, GRAB_Y);
    mouse(window, "mousemove", GRAB_X + 100, GRAB_Y + 60);
    mouse(window, "mouseup", 0, 0);
    mouse(window, "mousemove", GRAB_X + 300, GRAB_Y + 300);
    expect(panel.style.left).toBe("100px");
  });
});
