import { describe, expect, it } from "vitest";
// Read as plain text through Vite, which the project's types already cover.
import indexHtml from "../../index.html?raw";
import {
  DEFAULT_SETTINGS,
  SETTINGS_STORAGE_KEY,
  SPEECH_RATES,
  THEME_COLORS,
  parseSettings,
  resolveTheme,
} from "./settings";

describe("parseSettings", () => {
  it("uses the defaults when nothing has been saved", () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
  });

  it("keeps the app's original speech rate as the default", () => {
    // 0.9 was hard-coded before speed became a setting; existing learners
    // shouldn't hear a change they didn't ask for.
    expect(DEFAULT_SETTINGS.speechRate).toBe(0.9);
    expect(SPEECH_RATES).toContain(DEFAULT_SETTINGS.speechRate);
  });

  it("reads back everything a learner saved", () => {
    const saved = { theme: "dark", showTransliteration: false, speechRate: 0.7 };
    expect(parseSettings(JSON.stringify(saved))).toEqual(saved);
  });

  it("falls back to defaults for unreadable data instead of throwing", () => {
    for (const raw of ["{not json", "[]", '"dark"', "42", "null"]) {
      expect(parseSettings(raw), raw).toEqual(DEFAULT_SETTINGS);
    }
  });

  it("replaces only the fields that are invalid, keeping the rest", () => {
    // e.g. a value from an older or newer version of the app.
    const raw = JSON.stringify({ theme: "sepia", showTransliteration: false, speechRate: 2 });
    expect(parseSettings(raw)).toEqual({
      ...DEFAULT_SETTINGS,
      showTransliteration: false,
    });
  });

  it("rejects values of the wrong type", () => {
    const raw = JSON.stringify({ theme: 1, showTransliteration: "no", speechRate: "0.7" });
    expect(parseSettings(raw)).toEqual(DEFAULT_SETTINGS);
  });
});

describe("resolveTheme", () => {
  it("follows the device when set to match it", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
  });

  it("lets an explicit choice override the device either way", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });
});

describe("index.html's first-paint theme script", () => {
  // It can't import settings.ts, so it repeats the storage key. If the two
  // drift apart, dark-mode learners get a flash of the light theme on load.
  it("reads the same storage key as the settings module", () => {
    expect(indexHtml).toContain(`"${SETTINGS_STORAGE_KEY}"`);
  });

  it("sets the data-theme attribute that settings.ts and the stylesheet use", () => {
    expect(indexHtml).toContain("document.documentElement.dataset.theme");
  });

  it("repeats both theme-colour values, which it also can't import", () => {
    // Drift here would leave an installed app's title bar the wrong colour
    // until the first theme change re-synced it.
    expect(indexHtml).toContain(`"${THEME_COLORS.dark}"`);
    expect(indexHtml).toContain(`"${THEME_COLORS.light}"`);
  });
});
