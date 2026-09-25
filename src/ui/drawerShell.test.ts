// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { emptyStats } from "../core";
import { store } from "../player";
import { installChromeMock, uninstallChromeMock } from "../testing/chromeMock";

import {
  DRAWER_DOCK_ID,
  DRAWER_HANDLE_ID,
  DRAWER_ID,
  PRACTICE_DRAWER_ID,
  PRACTICE_HANDLE_ID,
  PRACTICE_TOTAL_ID,
} from "./dom";
import { mountDrawer, unmountDrawer } from "./drawer";
import { isDrawerOpen } from "./drawerShell";
import { mountPracticeDrawer, unmountPracticeDrawer } from "./practiceDrawer";

const PRACTICE_SECONDS = 120;
const HANDLE_SELECTOR = `#${DRAWER_DOCK_ID} .ytloop-drawer-handle`;

const click = (id: string): void => {
  document.getElementById(id)?.click();
};

const clickOutside = (): void => {
  document.body.dispatchEvent(new Event("pointerdown", { bubbles: true }));
};

describe("drawer shell", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    installChromeMock();
    store.stats = { ...emptyStats(), seconds: PRACTICE_SECONDS };
    mountDrawer();
    mountPracticeDrawer();
  });

  afterEach(() => {
    unmountDrawer();
    unmountPracticeDrawer();
    uninstallChromeMock();
  });

  it("docks both handles together", () => {
    expect(document.querySelectorAll(HANDLE_SELECTOR)).toHaveLength(2);
  });

  it("holds the practice total in the drawer head", () => {
    expect(document.getElementById(PRACTICE_TOTAL_ID)?.textContent).toBe("2:00");
  });

  it("keeps one drawer open at a time", () => {
    click(DRAWER_HANDLE_ID);
    expect(isDrawerOpen(DRAWER_ID)).toBe(true);
    click(PRACTICE_HANDLE_ID);
    expect(isDrawerOpen(PRACTICE_DRAWER_ID)).toBe(true);
    expect(isDrawerOpen(DRAWER_ID)).toBe(false);
  });

  it("closes an open drawer on a click outside it", () => {
    click(PRACTICE_HANDLE_ID);
    clickOutside();
    expect(isDrawerOpen(PRACTICE_DRAWER_ID)).toBe(false);
  });

  it("leaves a drawer alone while the click lands inside it", () => {
    click(DRAWER_HANDLE_ID);
    document.getElementById(DRAWER_ID)?.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    expect(isDrawerOpen(DRAWER_ID)).toBe(true);
  });

  it("removes the dock with the last drawer", () => {
    unmountDrawer();
    expect(document.getElementById(DRAWER_DOCK_ID)).not.toBeNull();
    unmountPracticeDrawer();
    expect(document.getElementById(DRAWER_DOCK_ID)).toBeNull();
  });
});
