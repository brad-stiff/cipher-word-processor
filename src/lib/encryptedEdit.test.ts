import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, encrypt, type CipherSettings } from "../ciphers";
import { plaintextFromEncryptedEdit } from "./encryptedEdit";

const caesar3: CipherSettings = { ...DEFAULT_SETTINGS, id: "caesar", shift: 3 };

describe("plaintextFromEncryptedEdit", () => {
  it("treats typed characters as plaintext and leaves the rest mapped", () => {
    const plain = "Hello";
    const cipher = encrypt(plain, caesar3); // Khoor
    const typed = cipher + "a";
    const nextPlain = plaintextFromEncryptedEdit(plain, cipher, typed);
    expect(nextPlain).toBe("Helloa");
    expect(encrypt(nextPlain, caesar3)).toBe("Khoord");
  });

  it("handles deletions in the cipher view", () => {
    const plain = "Hello";
    const cipher = encrypt(plain, caesar3);
    const next = cipher.slice(0, 4); // drop last cipher char
    expect(plaintextFromEncryptedEdit(plain, cipher, next)).toBe("Hell");
  });

  it("handles replacements in the middle", () => {
    const plain = "Hello";
    const cipher = encrypt(plain, caesar3); // Khoor
    // Replace cipher "oo" (indices 2–4) by typing "xy" → plain "ll" becomes "xy"
    const next = "Kh" + "xy" + "r";
    expect(plaintextFromEncryptedEdit(plain, cipher, next)).toBe("Hexyo");
  });
});
