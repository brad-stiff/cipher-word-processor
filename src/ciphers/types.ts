export type CipherId =
  | "none"
  | "caesar"
  | "rot13"
  | "atbash"
  | "vigenere"
  | "affine"
  | "substitution"
  | "railfence"
  | "playfair";

export type ViewMode = "plain" | "encrypted" | "side-by-side" | "reveal";

export interface CipherSettings {
  id: CipherId;
  shift: number;
  keyword: string;
  rails: number;
  affineA: number;
  affineB: number;
  substitutionKey: string;
}

export interface CipherDefinition {
  id: CipherId;
  name: string;
  description: string;
  /** Short formula / rule for the cheat sheet panel. */
  formula: string;
  /**
   * When true, plaintext and ciphertext share indices character-for-character,
   * so Encrypted-view editing is safe. Rail Fence / Playfair set this false.
   */
  preservesLength: boolean;
  needsShift?: boolean;
  needsKeyword?: boolean;
  needsRails?: boolean;
  needsAffine?: boolean;
  needsSubstitution?: boolean;
}

/** Sample plaintext used in the cipher help live example. */
export const CIPHER_HELP_SAMPLE = "THE QUICK BROWN FOX";

export const CIPHERS: CipherDefinition[] = [
  {
    id: "none",
    name: "None",
    description:
      "Leaves text unchanged. Saves and opens as ordinary .txt with no password.",
    formula: "C = P (identity)",
    preservesLength: true,
  },
  {
    id: "caesar",
    name: "Caesar",
    description:
      "Shifts each letter by a fixed amount (wraps at Z). Non-letters stay as-is. Saving requires a password and writes a locked .cwp file.",
    formula: "Cᵢ = (Pᵢ + shift) mod 26",
    preservesLength: true,
    needsShift: true,
  },
  {
    id: "rot13",
    name: "ROT13",
    description:
      "Caesar with a fixed shift of 13 — applying it twice restores the original. Saving requires a password (.cwp).",
    formula: "Cᵢ = (Pᵢ + 13) mod 26  (= Caesar₁₃)",
    preservesLength: true,
  },
  {
    id: "atbash",
    name: "Atbash",
    description:
      "Mirrors the alphabet (A↔Z, B↔Y, …). Applying it twice restores the original. Saving requires a password (.cwp).",
    formula: "Cᵢ = (25 − Pᵢ) mod 26",
    preservesLength: true,
  },
  {
    id: "vigenere",
    name: "Vigenère",
    description:
      "Shifts each letter by the next letter of a keyword (repeating). Only A–Z in the keyword count. Saving requires a password (.cwp).",
    formula: "Cᵢ = (Pᵢ + Kᵢ) mod 26  (K repeats; non-letters skip K)",
    preservesLength: true,
    needsKeyword: true,
  },
  {
    id: "affine",
    name: "Affine",
    description:
      "Each letter maps to (a×x + b) mod 26. a must be coprime with 26. Saving requires a password (.cwp).",
    formula: "C = (a·P + b) mod 26,  gcd(a, 26) = 1",
    preservesLength: true,
    needsAffine: true,
  },
  {
    id: "substitution",
    name: "Substitution",
    description:
      "Each plaintext letter is replaced by a fixed cipher letter from a 26-letter key. Saving requires a password (.cwp).",
    formula: "C = Key[P]  (Key is a permutation of A–Z)",
    preservesLength: true,
    needsSubstitution: true,
  },
  {
    id: "railfence",
    name: "Rail Fence",
    description:
      "Writes text in a zigzag across several rails, then reads row by row. Same length, but positions move — Encrypted view is read-only. Saving requires a password (.cwp).",
    formula: "Write zigzag on R rails → read row by row",
    preservesLength: false,
    needsRails: true,
  },
  {
    id: "playfair",
    name: "Playfair",
    description:
      "Encrypts letter pairs with a 5×5 keyword square (I/J share a cell). May insert X for padding or doubles — Encrypted view is read-only. Saving requires a password (.cwp).",
    formula: "Digraphs on 5×5 square (same row/col/rectangle rules; I/J shared)",
    preservesLength: false,
    needsKeyword: true,
  },
];

export function cipherPreservesLength(id: CipherId): boolean {
  return CIPHERS.find((c) => c.id === id)?.preservesLength ?? false;
}

export const DEFAULT_SETTINGS: CipherSettings = {
  id: "caesar",
  shift: 3,
  keyword: "KEY",
  rails: 3,
  affineA: 5,
  affineB: 8,
  substitutionKey: "QWERTYUIOPASDFGHJKLZXCVBNM",
};
