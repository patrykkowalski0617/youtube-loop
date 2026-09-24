import { afterEach, describe, expect, it } from "vitest";

import { installChromeMock, uninstallChromeMock } from "../testing/chromeMock";

import { extensionVersion } from "./version";

describe("extensionVersion", () => {
  afterEach(() => {
    uninstallChromeMock();
  });

  it("reads the version out of the manifest", () => {
    installChromeMock();
    expect(extensionVersion()).toBe("0.0.0");
  });

  it("is empty when the extension runtime is missing", () => {
    expect(extensionVersion()).toBe("");
  });
});
