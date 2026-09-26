import { describe, expect, it } from "vitest";

import {
  DEFAULT_LANGUAGE,
  detectLanguage,
  DICTIONARIES,
  isLanguage,
  LANGUAGE_LABELS,
  LANGUAGES,
} from "./languages";

describe("isLanguage", () => {
  it("accepts a supported code and rejects anything else", () => {
    expect(isLanguage("pl")).toBe(true);
    expect(isLanguage("de")).toBe(false);
    expect(isLanguage(7)).toBe(false);
  });
});

describe("detectLanguage", () => {
  it("takes the first supported tag on the list", () => {
    expect(detectLanguage(["de-DE", "pl-PL", "en-US"])).toBe("pl");
  });

  it("reads the base of a regional tag, whatever its case", () => {
    expect(detectLanguage(["PL-pl"])).toBe("pl");
  });

  it("falls back to the default when nothing matches", () => {
    expect(detectLanguage(["de", "fr"])).toBe(DEFAULT_LANGUAGE);
    expect(detectLanguage([])).toBe(DEFAULT_LANGUAGE);
  });
});

describe("the language registry", () => {
  it("carries a native label and a dictionary for every supported code", () => {
    for (const code of LANGUAGES) {
      expect(LANGUAGE_LABELS[code]).toBeTruthy();
      expect(DICTIONARIES[code].side.tabSettings).toBeTruthy();
    }
  });

  it("writes each label in its own tongue rather than translating it", () => {
    expect(LANGUAGE_LABELS.pl).toBe("Polski");
    expect(LANGUAGE_LABELS.en).toBe("English");
  });
});
