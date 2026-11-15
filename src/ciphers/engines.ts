import type { CipherSettings } from "./types";

function shiftChar(char: string, shift: number): string {
  const code = char.charCodeAt(0);
  if (code >= 65 && code <= 90) {
    return String.fromCharCode(((code - 65 + shift + 26) % 26) + 65);
  }
  if (code >= 97 && code <= 122) {
    return String.fromCharCode(((code - 97 + shift + 26) % 26) + 97);
  }
  return char;
}

export function caesar(text: string, shift: number, decrypt = false): string {
  const s = decrypt ? -shift : shift;
  return Array.from(text, (ch) => shiftChar(ch, s)).join("");
}

export function rot13(text: string): string {
  return caesar(text, 13);
}

export function atbash(text: string): string {
  return Array.from(text, (ch) => {
    const code = ch.charCodeAt(0);
    if (code >= 65 && code <= 90) {
      return String.fromCharCode(90 - (code - 65));
    }
    if (code >= 97 && code <= 122) {
      return String.fromCharCode(122 - (code - 97));
    }
    return ch;
  }).join("");
}

function lettersOnly(keyword: string): string {
  return keyword.replace(/[^a-zA-Z]/g, "");
}

export function vigenere(
  text: string,
  keyword: string,
  decrypt = false,
): string {
  const key = lettersOnly(keyword);
  if (!key) return text;

  let keyIndex = 0;
  return Array.from(text, (ch) => {
    const code = ch.charCodeAt(0);
    const isUpper = code >= 65 && code <= 90;
    const isLower = code >= 97 && code <= 122;
    if (!isUpper && !isLower) return ch;

    const base = isUpper ? 65 : 97;
    const keyChar = key[keyIndex % key.length];
    keyIndex += 1;
    const keyShift = keyChar.toUpperCase().charCodeAt(0) - 65;
    const shift = decrypt ? -keyShift : keyShift;
    return String.fromCharCode(((code - base + shift + 26) % 26) + base);
  }).join("");
}

export function encrypt(text: string, settings: CipherSettings): string {
  switch (settings.id) {
    case "none":
      return text;
    case "caesar":
      return caesar(text, settings.shift);
    case "rot13":
      return rot13(text);
    case "atbash":
      return atbash(text);
    case "vigenere":
      return vigenere(text, settings.keyword);
  }
}

export function decrypt(text: string, settings: CipherSettings): string {
  switch (settings.id) {
    case "none":
      return text;
    case "caesar":
      return caesar(text, settings.shift, true);
    case "rot13":
      return rot13(text);
    case "atbash":
      return atbash(text);
    case "vigenere":
      return vigenere(text, settings.keyword, true);
  }
}
