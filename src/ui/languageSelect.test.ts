// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { currentLanguage, setLanguage } from "../i18n";
import { installChromeMock, uninstallChromeMock } from "../testing/chromeMock";

import { closeLanguageMenu, languageRow } from "./languageSelect";

function need(selector: string): HTMLElement {
  const node = document.querySelector<HTMLElement>(selector);
  if (!node) throw new Error(`Missing element: ${selector}`);
  return node;
}

const row = (): HTMLElement => need(".ytloop-setting-row");

const menu = (): HTMLElement => need(".ytloop-lang-menu");

const options = (): HTMLButtonElement[] => [
  ...document.querySelectorAll<HTMLButtonElement>(".ytloop-lang-option"),
];

const press = (node: Element, key: string): void => {
  node.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
};

describe("the language row", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    installChromeMock();
    setLanguage("en");
    document.body.append(languageRow());
  });

  afterEach(() => {
    closeLanguageMenu();
    setLanguage("en");
    uninstallChromeMock();
  });

  it("names the setting and shows the active language in its own tongue", () => {
    expect(row().getAttribute("aria-label")).toBe("Language");
    expect(document.querySelector(".ytloop-setting-value")?.textContent).toBe("English");
  });

  it("keeps the list shut until the row is used", () => {
    expect(menu().hidden).toBe(true);
    expect(row().getAttribute("aria-expanded")).toBe("false");
  });

  it("opens the list on a click and closes it on a second one", () => {
    row().click();
    expect(menu().hidden).toBe(false);
    expect(row().getAttribute("aria-expanded")).toBe("true");
    row().click();
    expect(menu().hidden).toBe(true);
  });

  it("offers every language in its own tongue and marks the active one", () => {
    row().click();
    expect(options().map((o) => o.lang)).toEqual(["en", "pl"]);
    expect(options()[0]?.getAttribute("aria-selected")).toBe("true");
    expect(options()[1]?.getAttribute("aria-selected")).toBe("false");
    expect(options()[0]?.textContent).toContain("English");
  });

  it("applies the language picked and shuts the list", () => {
    row().click();
    options()[1]?.click();
    expect(currentLanguage()).toBe("pl");
    expect(menu().hidden).toBe(true);
  });

  it("opens on an arrow key and puts focus on the active language", () => {
    press(row(), "ArrowDown");
    expect(menu().hidden).toBe(false);
    expect(document.activeElement).toBe(options()[0]);
  });

  it("walks the list with the arrow keys and wraps around", () => {
    press(row(), "ArrowDown");
    press(options()[0] as Element, "ArrowDown");
    expect(document.activeElement).toBe(options()[1]);
    press(options()[1] as Element, "ArrowDown");
    expect(document.activeElement).toBe(options()[0]);
    press(options()[0] as Element, "ArrowUp");
    expect(document.activeElement).toBe(options()[1]);
  });

  it("closes on escape and hands focus back to the row", () => {
    press(row(), "ArrowDown");
    press(options()[0] as Element, "Escape");
    expect(menu().hidden).toBe(true);
    expect(document.activeElement).toBe(row());
  });

  it("can be forced shut from outside, as the drawer does when it closes", () => {
    row().click();
    closeLanguageMenu();
    expect(menu().hidden).toBe(true);
    expect(row().getAttribute("aria-expanded")).toBe("false");
  });
});
