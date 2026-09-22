// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";

import { isEditableTarget } from "./dom";

describe("isEditableTarget", () => {
  beforeEach(() => {
    document.body.innerHTML =
      '<input id="field"><div id="plain"></div><div contenteditable="true"><span id="inside"></span></div>';
  });

  it("recognises the fields a person types into", () => {
    expect(isEditableTarget(document.getElementById("field"))).toBe(true);
    expect(isEditableTarget(document.getElementById("plain"))).toBe(false);
    expect(isEditableTarget(null)).toBe(false);
  });

  it("recognises a caret sitting inside a rich text area", () => {
    expect(isEditableTarget(document.getElementById("inside"))).toBe(true);
  });

  it("protects typing even when the event is reported against another element", () => {
    document.getElementById("field")?.focus();
    expect(isEditableTarget(document.getElementById("plain"))).toBe(true);
  });

  it("stops protecting once the field loses focus", () => {
    const field = document.getElementById("field");
    field?.focus();
    (field as HTMLInputElement | null)?.blur();
    expect(isEditableTarget(document.getElementById("plain"))).toBe(false);
  });
});
