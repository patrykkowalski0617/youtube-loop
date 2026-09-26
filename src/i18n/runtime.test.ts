import { afterEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_LANGUAGE } from "./languages";
import { currentLanguage, onLanguageChange, setLanguage, t } from "./runtime";

afterEach(() => {
  setLanguage(DEFAULT_LANGUAGE);
});

describe("setLanguage", () => {
  it("starts on the default language", () => {
    expect(currentLanguage()).toBe(DEFAULT_LANGUAGE);
  });

  it("makes every later read of t come from the new dictionary", () => {
    expect(t.side.tabStats).toBe("Statistics");
    setLanguage("pl");
    expect(t.side.tabStats).toBe("Statystyki");
  });

  it("switches the strings built by a function too", () => {
    setLanguage("pl");
    expect(t.stats.repsCount(1)).toBe("1 powtórzenie");
    expect(t.stats.repsCount(3)).toBe("3 powtórzenia");
    expect(t.stats.repsCount(7)).toBe("7 powtórzeń");
  });
});

describe("onLanguageChange", () => {
  it("tells listeners once per actual change", () => {
    const listener = vi.fn();
    const stop = onLanguageChange(listener);
    setLanguage("pl");
    setLanguage("pl");
    expect(listener).toHaveBeenCalledTimes(1);
    stop();
  });

  it("stops telling a listener that unsubscribed", () => {
    const listener = vi.fn();
    onLanguageChange(listener)();
    setLanguage("pl");
    expect(listener).not.toHaveBeenCalled();
  });
});
