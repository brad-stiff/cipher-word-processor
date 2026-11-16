import { describe, expect, it } from "vitest";
import {
  atbash,
  caesar,
  decrypt,
  encrypt,
  rot13,
  vigenere,
} from "./engines";
import { CIPHERS, type CipherSettings } from "./types";

describe("caesar", () => {
  it("shifts letters and preserves punctuation", () => {
    expect(caesar("Hello, World!", 3)).toBe("Khoor, Zruog!");
  });

  it("decrypts with the same shift", () => {
    const plain = "The Quick Brown Fox";
    expect(caesar(caesar(plain, 7), 7, true)).toBe(plain);
  });

  it("wraps the alphabet", () => {
    expect(caesar("xyzXYZ", 3)).toBe("abcABC");
  });
});

describe("rot13", () => {
  it("is its own inverse", () => {
    expect(rot13("Hello")).toBe("Uryyb");
    expect(rot13(rot13("Hello"))).toBe("Hello");
  });
});

describe("atbash", () => {
  it("mirrors the alphabet", () => {
    expect(atbash("ABC")).toBe("ZYX");
    expect(atbash("abc")).toBe("zyx");
  });

  it("is its own inverse", () => {
    expect(atbash(atbash("Secret Message!"))).toBe("Secret Message!");
  });
});

describe("vigenere", () => {
  it("encrypts with a classic keyword", () => {
    expect(vigenere("ATTACKATDAWN", "LEMON")).toBe("LXFOPVEFRNHR");
  });

  it("decrypts with the same keyword", () => {
    const plain = "Attack at dawn!";
    const key = "LEMON";
    expect(vigenere(vigenere(plain, key), key, true)).toBe(plain);
  });

  it("ignores non-letters in the keyword", () => {
    expect(vigenere("AAAA", "A1B!")).toBe(vigenere("AAAA", "AB"));
  });

  it("returns plaintext when keyword has no letters", () => {
    expect(vigenere("Hello", "123")).toBe("Hello");
  });

  it("only advances the key on letters", () => {
    expect(vigenere("A B", "B")).toBe("B C");
  });
});

describe("encrypt / decrypt", () => {
  const cases: CipherSettings[] = [
    { id: "none", shift: 0, keyword: "" },
    { id: "caesar", shift: 5, keyword: "" },
    { id: "rot13", shift: 0, keyword: "" },
    { id: "atbash", shift: 0, keyword: "" },
    { id: "vigenere", shift: 0, keyword: "CIPHER" },
  ];

  for (const settings of cases) {
    it(`round-trips via ${settings.id}`, () => {
      const plain = "Pack my box with five dozen liquor jugs.";
      expect(decrypt(encrypt(plain, settings), settings)).toBe(plain);
    });
  }

  it("none leaves text unchanged", () => {
    const settings: CipherSettings = { id: "none", shift: 3, keyword: "KEY" };
    expect(encrypt("Hello", settings)).toBe("Hello");
    expect(decrypt("Hello", settings)).toBe("Hello");
  });
});

describe("preservesLength contract", () => {
  it("declares preservesLength on every cipher", () => {
    for (const cipher of CIPHERS) {
      expect(typeof cipher.preservesLength).toBe("boolean");
    }
  });

  it("keeps length for every length-preserving cipher", () => {
    const plain = "Pack my box with five dozen liquor jugs!";
    for (const cipher of CIPHERS.filter((c) => c.preservesLength)) {
      const settings: CipherSettings = {
        id: cipher.id,
        shift: 5,
        keyword: "CIPHER",
      };
      expect(encrypt(plain, settings).length).toBe(plain.length);
    }
  });
});
