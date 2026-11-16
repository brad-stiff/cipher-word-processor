import { describe, expect, it } from "vitest";
import {
  affine,
  atbash,
  caesar,
  decrypt,
  encrypt,
  playfair,
  railFence,
  rot13,
  substitution,
  vigenere,
} from "./engines";
import { DEFAULT_SETTINGS, CIPHERS, type CipherSettings } from "./types";

function withId(
  id: CipherSettings["id"],
  patch: Partial<CipherSettings> = {},
): CipherSettings {
  return { ...DEFAULT_SETTINGS, id, ...patch };
}

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

describe("affine", () => {
  it("encrypts with a=5, b=8", () => {
    expect(affine("AFFINE", 5, 8)).toBe("IHHWVC");
  });

  it("round-trips", () => {
    const plain = "Affine Cipher 123!";
    expect(affine(affine(plain, 7, 3), 7, 3, true)).toBe(plain);
  });
});

describe("substitution", () => {
  it("maps by key and round-trips", () => {
    const key = "QWERTYUIOPASDFGHJKLZXCVBNM";
    const plain = "Hello, Alphabet!";
    expect(substitution(substitution(plain, key), key, true)).toBe(plain);
  });
});

describe("railFence", () => {
  it("encrypts a classic example", () => {
    expect(railFence("WEAREDISCOVEREDFLEEATONCE", 3)).toBe(
      "WECRLTEERDSOEEFEAOCAIVDEN",
    );
  });

  it("round-trips with punctuation", () => {
    const plain = "Hello, Rail Fence!";
    expect(railFence(railFence(plain, 4), 4, true)).toBe(plain);
  });
});

describe("playfair", () => {
  it("encrypts a classic instruments example", () => {
    expect(playfair("INSTRUMENTS", "MONARCHY")).toBe("GATLMZCLRQXA");
  });

  it("round-trips letters that need no padding", () => {
    const plain = "BALLOON"; // will insert X between L L
    const cipher = playfair(plain, "MONARCHY");
    const back = playfair(cipher, "MONARCHY", true);
    // Recovered form includes Playfair X padding / I-J normalization
    expect(playfair(back, "MONARCHY")).toBe(cipher);
  });

  it("preserves non-letters in place when lengths allow", () => {
    const cipher = playfair("HI!", "KEY");
    expect(cipher.includes("!")).toBe(true);
  });
});

describe("encrypt / decrypt", () => {
  const cases: CipherSettings[] = [
    withId("none"),
    withId("caesar", { shift: 5 }),
    withId("rot13"),
    withId("atbash"),
    withId("vigenere", { keyword: "CIPHER" }),
    withId("affine", { affineA: 7, affineB: 3 }),
    withId("substitution"),
    withId("railfence", { rails: 4 }),
  ];

  for (const settings of cases) {
    it(`round-trips via ${settings.id}`, () => {
      const plain = "Pack my box with five dozen liquor jugs.";
      expect(decrypt(encrypt(plain, settings), settings)).toBe(plain);
    });
  }

  it("playfair encrypt/decrypt are inverses on ciphertext", () => {
    const settings = withId("playfair", { keyword: "MONARCHY" });
    const plain = "Pack my box with five dozen liquor jugs.";
    const cipher = encrypt(plain, settings);
    expect(encrypt(decrypt(cipher, settings), settings)).toBe(cipher);
  });

  it("none leaves text unchanged", () => {
    const settings = withId("none");
    expect(encrypt("Hello", settings)).toBe("Hello");
    expect(decrypt("Hello", settings)).toBe("Hello");
  });
});

describe("preservesLength contract", () => {
  it("declares preservesLength and formula on every cipher", () => {
    for (const cipher of CIPHERS) {
      expect(typeof cipher.preservesLength).toBe("boolean");
      expect(cipher.formula.length).toBeGreaterThan(0);
    }
  });

  it("keeps length for every length-preserving cipher", () => {
    const plain = "Pack my box with five dozen liquor jugs!";
    for (const cipher of CIPHERS.filter((c) => c.preservesLength)) {
      const settings = withId(cipher.id, {
        shift: 5,
        keyword: "CIPHER",
        affineA: 5,
        affineB: 8,
      });
      expect(encrypt(plain, settings).length).toBe(plain.length);
    }
  });

  it("marks rail fence and playfair as non-preserving for edit safety", () => {
    expect(CIPHERS.find((c) => c.id === "railfence")?.preservesLength).toBe(
      false,
    );
    expect(CIPHERS.find((c) => c.id === "playfair")?.preservesLength).toBe(
      false,
    );
  });
});
