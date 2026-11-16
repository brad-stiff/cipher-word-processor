import type { CipherId, CipherSettings } from "./types";

export const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** Valid multipliers for the Affine cipher (coprime with 26). */
export const AFFINE_A_VALUES = [
  1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25,
] as const;

export const CIPHER_IDS: CipherId[] = [
  "none",
  "caesar",
  "rot13",
  "atbash",
  "vigenere",
  "affine",
  "substitution",
  "railfence",
  "playfair",
];

export const DEFAULT_SUBSTITUTION_KEY = "QWERTYUIOPASDFGHJKLZXCVBNM";

export function normalizeSubstitutionKey(raw: string): string {
  const seen = new Set<string>();
  let out = "";
  for (const ch of raw.toUpperCase()) {
    if (ch >= "A" && ch <= "Z" && !seen.has(ch)) {
      seen.add(ch);
      out += ch;
    }
  }
  for (const ch of ALPHABET) {
    if (!seen.has(ch)) out += ch;
  }
  return out.slice(0, 26);
}

export function shuffleSubstitutionKey(random = Math.random): string {
  const chars = ALPHABET.split("");
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const tmp = chars[i];
    chars[i] = chars[j];
    chars[j] = tmp;
  }
  return chars.join("");
}

export function normalizeAffineA(value: unknown): number {
  const n =
    typeof value === "number" && Number.isFinite(value)
      ? Math.trunc(value)
      : 5;
  return (AFFINE_A_VALUES as readonly number[]).includes(n) ? n : 5;
}

export function normalizeCipherSettings(raw: unknown): CipherSettings {
  const defaults = {
    id: "caesar" as CipherId,
    shift: 3,
    keyword: "KEY",
    rails: 3,
    affineA: 5,
    affineB: 8,
    substitutionKey: DEFAULT_SUBSTITUTION_KEY,
  };

  if (!raw || typeof raw !== "object") return { ...defaults };

  const obj = raw as Record<string, unknown>;
  const id =
    typeof obj.id === "string" && CIPHER_IDS.includes(obj.id as CipherId)
      ? (obj.id as CipherId)
      : defaults.id;
  const shift =
    typeof obj.shift === "number" && Number.isFinite(obj.shift)
      ? Math.min(25, Math.max(0, Math.trunc(obj.shift)))
      : defaults.shift;
  const keyword =
    typeof obj.keyword === "string" ? obj.keyword : defaults.keyword;
  const rails =
    typeof obj.rails === "number" && Number.isFinite(obj.rails)
      ? Math.min(10, Math.max(2, Math.trunc(obj.rails)))
      : defaults.rails;
  const affineA = normalizeAffineA(obj.affineA);
  const affineB =
    typeof obj.affineB === "number" && Number.isFinite(obj.affineB)
      ? ((Math.trunc(obj.affineB) % 26) + 26) % 26
      : defaults.affineB;
  const substitutionKey =
    typeof obj.substitutionKey === "string"
      ? normalizeSubstitutionKey(obj.substitutionKey)
      : defaults.substitutionKey;

  return {
    id,
    shift,
    keyword,
    rails,
    affineA,
    affineB,
    substitutionKey,
  };
}
