import {
  DEFAULT_SETTINGS,
  type CipherId,
  type CipherSettings,
  type ViewMode,
} from "../ciphers";

const STORAGE_KEY = "cipher-word-processor.prefs";

const CIPHER_IDS: CipherId[] = ["caesar", "rot13", "atbash", "vigenere"];
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

function isCipherId(value: unknown): value is CipherId {
  return typeof value === "string" && CIPHER_IDS.includes(value as CipherId);
}

function isViewMode(value: unknown): value is ViewMode {
  return typeof value === "string" && VIEW_MODES.includes(value as ViewMode);
}

function normalizeSettings(raw: unknown): CipherSettings {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_SETTINGS };
  const obj = raw as Record<string, unknown>;
  const id = isCipherId(obj.id) ? obj.id : DEFAULT_SETTINGS.id;
  const shift =
    typeof obj.shift === "number" && Number.isFinite(obj.shift)
      ? Math.min(25, Math.max(0, Math.trunc(obj.shift)))
      : DEFAULT_SETTINGS.shift;
  const keyword =
    typeof obj.keyword === "string" ? obj.keyword : DEFAULT_SETTINGS.keyword;
  return { id, shift, keyword };
}

export function loadPreferences(): AppPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { settings: { ...DEFAULT_SETTINGS }, viewMode: "plain" };
    }
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      settings: normalizeSettings(parsed.settings),
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
