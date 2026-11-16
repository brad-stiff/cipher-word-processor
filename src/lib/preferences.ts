import {
  DEFAULT_SETTINGS,
  normalizeCipherSettings,
  type CipherSettings,
  type ViewMode,
} from "../ciphers";

const STORAGE_KEY = "cipher-word-processor.prefs";

const VIEW_MODES: ViewMode[] = [
  "plain",
  "encrypted",
  "side-by-side",
  "reveal",
];

export interface AppPreferences {
  settings: CipherSettings;
  viewMode: ViewMode;
}

function isViewMode(value: unknown): value is ViewMode {
  return typeof value === "string" && VIEW_MODES.includes(value as ViewMode);
}

export function loadPreferences(): AppPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { settings: { ...DEFAULT_SETTINGS }, viewMode: "plain" };
    }
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      settings: normalizeCipherSettings(parsed.settings),
      viewMode: isViewMode(parsed.viewMode) ? parsed.viewMode : "plain",
    };
  } catch {
    return { settings: { ...DEFAULT_SETTINGS }, viewMode: "plain" };
  }
}

export function savePreferences(prefs: AppPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore quota / private-mode failures.
  }
}
