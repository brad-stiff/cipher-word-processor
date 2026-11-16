import type { CipherSettings } from "./types";
import { ALPHABET, normalizeAffineA, normalizeSubstitutionKey } from "./settings";

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

function modInverse(a: number, m: number): number {
  let t = 0;
  let newT = 1;
  let r = m;
  let newR = ((a % m) + m) % m;
  while (newR !== 0) {
    const q = Math.floor(r / newR);
    [t, newT] = [newT, t - q * newT];
    [r, newR] = [newR, r - q * newR];
  }
  if (r > 1) return 1;
  if (t < 0) t += m;
  return t;
}

export function affine(
  text: string,
  a: number,
  b: number,
  decrypt = false,
): string {
  const A = normalizeAffineA(a);
  const B = ((b % 26) + 26) % 26;
  const inv = modInverse(A, 26);

  return Array.from(text, (ch) => {
    const code = ch.charCodeAt(0);
    const isUpper = code >= 65 && code <= 90;
    const isLower = code >= 97 && code <= 122;
    if (!isUpper && !isLower) return ch;
    const base = isUpper ? 65 : 97;
    const x = code - base;
    const y = decrypt
      ? (inv * (x - B + 26 * 10)) % 26
      : (A * x + B) % 26;
    return String.fromCharCode(base + y);
  }).join("");
}

export function substitution(
  text: string,
  key: string,
  decrypt = false,
): string {
  const alphabetKey = normalizeSubstitutionKey(key);
  const from = decrypt ? alphabetKey : ALPHABET;
  const to = decrypt ? ALPHABET : alphabetKey;

  return Array.from(text, (ch) => {
    const upper = ch.toUpperCase();
    if (upper < "A" || upper > "Z") return ch;
    const idx = from.indexOf(upper);
    const mapped = to[idx] ?? upper;
    return ch === upper ? mapped : mapped.toLowerCase();
  }).join("");
}

export function railFence(
  text: string,
  rails: number,
  decrypt = false,
): string {
  const n = Math.min(10, Math.max(2, Math.trunc(rails) || 2));
  if (n === 1 || text.length <= 1) return text;

  if (!decrypt) {
    const rows: string[] = Array.from({ length: n }, () => "");
    let row = 0;
    let dir = 1;
    for (const ch of text) {
      rows[row] += ch;
      if (row === 0) dir = 1;
      else if (row === n - 1) dir = -1;
      row += dir;
    }
    return rows.join("");
  }

  const len = text.length;
  const rowLens = Array.from({ length: n }, () => 0);
  let row = 0;
  let dir = 1;
  for (let i = 0; i < len; i += 1) {
    rowLens[row] += 1;
    if (row === 0) dir = 1;
    else if (row === n - 1) dir = -1;
    row += dir;
  }

  const rows: string[] = [];
  let offset = 0;
  for (let r = 0; r < n; r += 1) {
    rows.push(text.slice(offset, offset + rowLens[r]));
    offset += rowLens[r];
  }

  const rowIdx = Array.from({ length: n }, () => 0);
  const out: string[] = [];
  row = 0;
  dir = 1;
  for (let i = 0; i < len; i += 1) {
    out.push(rows[row][rowIdx[row]]);
    rowIdx[row] += 1;
    if (row === 0) dir = 1;
    else if (row === n - 1) dir = -1;
    row += dir;
  }
  return out.join("");
}

function playfairSquare(keyword: string): string[] {
  const seen = new Set<string>();
  const cells: string[] = [];
  const push = (ch: string) => {
    const c = ch === "J" ? "I" : ch;
    if (c < "A" || c > "Z" || seen.has(c)) return;
    seen.add(c);
    cells.push(c);
  };
  for (const ch of lettersOnly(keyword).toUpperCase()) push(ch);
  for (const ch of ALPHABET) {
    if (ch !== "J") push(ch);
  }
  return cells;
}

function playfairPrepareLetters(letters: string[]): string[] {
  const prepared: string[] = [];
  let i = 0;
  while (i < letters.length) {
    const a = letters[i];
    const b = letters[i + 1];
    if (b === undefined) {
      prepared.push(a, "X");
      i += 1;
    } else if (a === b) {
      prepared.push(a, "X");
      i += 1;
    } else {
      prepared.push(a, b);
      i += 2;
    }
  }
  return prepared;
}

function playfairShiftPair(
  square: string[],
  a: string,
  b: string,
  decrypt: boolean,
): [string, string] {
  const pos = (ch: string) => {
    const idx = square.indexOf(ch === "J" ? "I" : ch);
    return { r: Math.floor(idx / 5), c: idx % 5 };
  };
  const at = (r: number, c: number) =>
    square[(((r % 5) + 5) % 5) * 5 + (((c % 5) + 5) % 5)];
  const pa = pos(a);
  const pb = pos(b);
  const step = decrypt ? -1 : 1;

  if (pa.r === pb.r) {
    return [at(pa.r, pa.c + step), at(pb.r, pb.c + step)];
  }
  if (pa.c === pb.c) {
    return [at(pa.r + step, pa.c), at(pb.r + step, pb.c)];
  }
  return [at(pa.r, pb.c), at(pb.r, pa.c)];
}

function matchCase(template: string, letter: string): string {
  return template === template.toUpperCase()
    ? letter.toUpperCase()
    : letter.toLowerCase();
}

/**
 * Playfair over the letter stream (I/J merged). Non-letters keep their places;
 * padding X letters that don't fit are appended. Decrypt restores that form
 * (including padding X), so round-trip may differ from the original by J→I
 * and inserted X.
 */
export function playfair(
  text: string,
  keyword: string,
  decrypt = false,
): string {
  const square = playfairSquare(keyword || "KEY");
  const letterInfos: { ch: string; upper: string }[] = [];
  for (const ch of text) {
    const upper = ch.toUpperCase();
    if (upper < "A" || upper > "Z") continue;
    letterInfos.push({ ch, upper: upper === "J" ? "I" : upper });
  }

  if (letterInfos.length === 0) return text;

  let stream: string[];
  if (decrypt) {
    const letters = letterInfos.map((l) => l.upper);
    if (letters.length % 2 === 1) letters.push("X");
    stream = [];
    for (let i = 0; i < letters.length; i += 2) {
      const [x, y] = playfairShiftPair(square, letters[i], letters[i + 1], true);
      stream.push(x, y);
    }
  } else {
    const prepared = playfairPrepareLetters(letterInfos.map((l) => l.upper));
    stream = [];
    for (let i = 0; i < prepared.length; i += 2) {
      const [x, y] = playfairShiftPair(
        square,
        prepared[i],
        prepared[i + 1],
        false,
      );
      stream.push(x, y);
    }
  }

  const out: string[] = [];
  let li = 0;
  for (const ch of text) {
    const upper = ch.toUpperCase();
    if (upper < "A" || upper > "Z") {
      out.push(ch);
      continue;
    }
    const next = stream[li] ?? "X";
    li += 1;
    out.push(matchCase(ch, next));
  }
  while (li < stream.length) {
    out.push(stream[li]);
    li += 1;
  }
  return out.join("");
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
    case "affine":
      return affine(text, settings.affineA, settings.affineB);
    case "substitution":
      return substitution(text, settings.substitutionKey);
    case "railfence":
      return railFence(text, settings.rails);
    case "playfair":
      return playfair(text, settings.keyword);
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
    case "affine":
      return affine(text, settings.affineA, settings.affineB, true);
    case "substitution":
      return substitution(text, settings.substitutionKey, true);
    case "railfence":
      return railFence(text, settings.rails, true);
    case "playfair":
      return playfair(text, settings.keyword, true);
  }
}
