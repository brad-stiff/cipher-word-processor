import { beforeEach, describe, expect, it } from "vitest";
import { loadPreferences, savePreferences } from "./preferences";
import { DEFAULT_SETTINGS, normalizeCipherSettings } from "../ciphers";

const memory = new Map<string, string>();

beforeEach(() => {
  memory.clear();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => {
        memory.set(key, value);
      },
      removeItem: (key: string) => {
        memory.delete(key);
      },
    },
  });
});

describe("preferences", () => {
  it("returns defaults when empty", () => {
    expect(loadPreferences()).toEqual({
      settings: DEFAULT_SETTINGS,
      viewMode: "plain",
    });
  });

  it("round-trips valid preferences", () => {
    const settings = normalizeCipherSettings({
      id: "vigenere",
      shift: 0,
      keyword: "LEMON",
    });
    savePreferences({
      settings,
      viewMode: "reveal",
    });
    expect(loadPreferences()).toEqual({
      settings,
      viewMode: "reveal",
    });
  });

  it("accepts none cipher", () => {
    savePreferences({
      settings: normalizeCipherSettings({
        id: "none",
        shift: 3,
        keyword: "KEY",
      }),
      viewMode: "plain",
    });
    expect(loadPreferences().settings.id).toBe("none");
  });

  it("clamps shift and rejects bad view modes", () => {
    memory.set(
      "cipher-word-processor.prefs",
      JSON.stringify({
        settings: { id: "caesar", shift: 99, keyword: "X" },
        viewMode: "nope",
      }),
    );
    expect(loadPreferences()).toEqual({
      settings: normalizeCipherSettings({
        id: "caesar",
        shift: 25,
        keyword: "X",
      }),
      viewMode: "plain",
    });
  });
});
