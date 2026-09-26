// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { store } from "../player";
import { installChromeMock, uninstallChromeMock } from "../testing/chromeMock";
import { flushAsync } from "../testing/flush";

import { resetSavedTab } from "./savedTab";
import {
  isSideDrawerOpen,
  mountSideDrawer,
  setActiveTab,
  setSideDrawerOpen,
  unmountSideDrawer,
} from "./sideDrawer";

const tabs = (): (string | null)[] =>
  [...document.querySelectorAll("#ytloop-drawer-tabs button")].map((b) => b.textContent);

const body = (): HTMLElement | null => document.getElementById("ytloop-drawer-body");

const selected = (): string | undefined =>
  document.querySelector("#ytloop-drawer-tabs .selected")?.textContent ?? undefined;

describe("the side drawer", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    installChromeMock();
    store.videoId = null;
    store.tags = [];
    mountSideDrawer();
  });

  afterEach(() => {
    resetSavedTab();
    setActiveTab("saved");
    unmountSideDrawer();
    uninstallChromeMock();
  });

  it("mounts one drawer with one handle, whatever the number of calls", () => {
    mountSideDrawer();
    expect(document.querySelectorAll("#ytloop-drawer")).toHaveLength(1);
    expect(document.querySelectorAll("#ytloop-drawer-handle")).toHaveLength(1);
  });

  it("offers the saved videos, the statistics and the settings, in that order", () => {
    expect(tabs()).toEqual(["Saved videos", "Statistics", "Settings"]);
  });

  it("opens on the saved videos", async () => {
    setSideDrawerOpen(true);
    await flushAsync();
    expect(selected()).toBe("Saved videos");
    expect(document.getElementById("ytloop-drawer-list")).not.toBeNull();
  });

  it("swaps the body when another tab is picked", async () => {
    setSideDrawerOpen(true);
    setActiveTab("settings");
    await flushAsync();
    expect(selected()).toBe("Settings");
    expect(body()?.querySelector(".ytloop-setting-row")).not.toBeNull();
    expect(document.getElementById("ytloop-drawer-list")).toBeNull();
  });

  it("leaves the body alone while the drawer stays shut", () => {
    setActiveTab("settings");
    expect(body()?.childElementCount).toBe(0);
  });

  it("closes on the close button and on a click outside itself", () => {
    setSideDrawerOpen(true);
    expect(isSideDrawerOpen()).toBe(true);
    document.querySelector<HTMLElement>("#ytloop-drawer .ytloop-icon-btn")?.click();
    expect(isSideDrawerOpen()).toBe(false);

    setSideDrawerOpen(true);
    document.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    expect(isSideDrawerOpen()).toBe(false);
  });

  it("stays open when the click lands inside it", () => {
    setSideDrawerOpen(true);
    document
      .getElementById("ytloop-drawer")
      ?.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    expect(isSideDrawerOpen()).toBe(true);
  });

  it("takes the handle and the drawer away when unmounted", () => {
    unmountSideDrawer();
    expect(document.getElementById("ytloop-drawer")).toBeNull();
    expect(document.getElementById("ytloop-drawer-handle")).toBeNull();
  });
});
