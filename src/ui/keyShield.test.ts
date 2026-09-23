// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { byId } from "./dom";
import { shieldKeys } from "./keyShield";

const KEY_EVENTS = ["keydown", "keyup", "keypress"];

let field: HTMLElement;
let other: HTMLElement;
let reached: string[];
let detachSpies: (() => void)[];

const press = (target: HTMLElement): void => {
  for (const type of KEY_EVENTS) {
    target.dispatchEvent(new KeyboardEvent(type, { key: " ", bubbles: true }));
  }
};

describe("shieldKeys", () => {
  beforeEach(() => {
    document.body.innerHTML = '<input id="field"><input id="other">';
    field = byId(document, "field");
    other = byId(document, "other");
    reached = [];
    detachSpies = KEY_EVENTS.map((type) => {
      const spy = (e: Event): void => {
        reached.push(e.type);
      };
      document.addEventListener(type, spy, true);
      return () => {
        document.removeEventListener(type, spy, true);
      };
    });
  });

  afterEach(() => {
    for (const detach of detachSpies) detach();
  });

  it("keeps every kind of key event inside the shielded field", () => {
    shieldKeys(field);
    press(field);
    expect(reached).toEqual([]);
  });

  it("lets other elements keep their keys", () => {
    shieldKeys(field);
    press(other);
    expect(reached).toEqual(KEY_EVENTS);
  });

  it("reports the key that was pressed, and only on the way down", () => {
    const seen: string[] = [];
    shieldKeys(field, (e) => {
      seen.push(e.type);
    });
    press(field);
    expect(seen).toEqual(["keydown"]);
  });

  it("stops shielding once detached, so a reopened field cannot leak listeners", () => {
    const detach = shieldKeys(field);
    detach();
    press(field);
    expect(reached).toEqual(KEY_EVENTS);
  });
});
