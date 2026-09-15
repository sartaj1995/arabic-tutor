import { useSyncExternalStore } from "react";

/**
 * Learner preferences, saved per device in localStorage. They're deliberately
 * not part of the progress backup: they describe this device and how the
 * learner likes to study, not what they've learned.
 */

export type ThemePreference = "system" | "light" | "dark";
export type SpeechRate = 0.7 | 0.9 | 1;

export interface Settings {
  theme: ThemePreference;
  showTransliteration: boolean;
  speechRate: SpeechRate;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  showTransliteration: true,
  // The app's fixed rate before this became a setting.
  speechRate: 0.9,
};

/** Also read by the inline script in index.html, which applies the theme before first paint. */
export const SETTINGS_STORAGE_KEY = "arabic-tutor:settings";

export const SPEECH_RATES: readonly SpeechRate[] = [0.7, 0.9, 1];
const THEME_PREFERENCES: readonly ThemePreference[] = ["system", "light", "dark"];

/**
 * Reads stored settings field by field, so one corrupt or outdated value falls
 * back to its default without throwing away the others.
 */
export function parseSettings(raw: string | null): Settings {
  let stored: Record<string, unknown> = {};
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      stored = parsed as Record<string, unknown>;
    }
  } catch {
    // Unreadable JSON: every field keeps its default.
  }

  const theme = stored.theme as ThemePreference;
  const speechRate = stored.speechRate as SpeechRate;
  return {
    theme: THEME_PREFERENCES.includes(theme) ? theme : DEFAULT_SETTINGS.theme,
    showTransliteration:
      typeof stored.showTransliteration === "boolean"
        ? stored.showTransliteration
        : DEFAULT_SETTINGS.showTransliteration,
    speechRate: SPEECH_RATES.includes(speechRate) ? speechRate : DEFAULT_SETTINGS.speechRate,
  };
}

/** The theme actually shown: an explicit choice wins, otherwise the device decides. */
export function resolveTheme(preference: ThemePreference, deviceIsDark: boolean): "light" | "dark" {
  if (preference === "system") return deviceIsDark ? "dark" : "light";
  return preference;
}

// --- Live store (browser only; the tests run without a window) -------------

const hasWindow = typeof window !== "undefined";

function readStored(): string | null {
  try {
    return hasWindow ? window.localStorage.getItem(SETTINGS_STORAGE_KEY) : null;
  } catch {
    // Storage can be blocked entirely (some private modes, strict cookie settings).
    return null;
  }
}

let current: Settings = parseSettings(readStored());
const listeners = new Set<() => void>();
const deviceDarkQuery =
  hasWindow && typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-color-scheme: dark)")
    : null;

function applyTheme() {
  if (!hasWindow) return;
  document.documentElement.dataset.theme = resolveTheme(
    current.theme,
    deviceDarkQuery?.matches ?? false,
  );
}

function publish(next: Settings) {
  current = next;
  applyTheme();
  for (const listener of listeners) listener();
}

export function getSettings(): Settings {
  return current;
}

export function updateSettings(patch: Partial<Settings>): void {
  const next = { ...current, ...patch };
  try {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Not saved, but still applied for the rest of this visit.
  }
  publish(next);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The current settings, re-rendering the caller whenever any of them change. */
export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, getSettings, () => DEFAULT_SETTINGS);
}

if (hasWindow) {
  applyTheme();
  // "Match device" follows the device live, e.g. an automatic switch at sunset.
  deviceDarkQuery?.addEventListener("change", applyTheme);
  // Keeps other open tabs in step with a change made here.
  window.addEventListener("storage", (event) => {
    if (event.key === SETTINGS_STORAGE_KEY) publish(parseSettings(event.newValue));
  });
}
