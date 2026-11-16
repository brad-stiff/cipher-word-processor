export type CipherId = "none" | "caesar" | "rot13" | "atbash" | "vigenere";

export type ViewMode = "plain" | "encrypted" | "side-by-side" | "reveal";

export interface CipherSettings {
  id: CipherId;
  shift: number;
  keyword: string;
}

export interface CipherDefinition {
  id: CipherId;
  name: string;
  description: string;
  /**
   * When true, plaintext and ciphertext share the same length and character
   * indices. Encrypted-view editing (mapping keystrokes back to plaintext)
   * is only safe for these ciphers.
   */
  preservesLength: boolean;
  needsShift?: boolean;
  needsKeyword?: boolean;
}

export const CIPHERS: CipherDefinition[] = [
  {
    id: "none",
    name: "None",
    description: "No encryption — save and open as plain text",
    preservesLength: true,
  },
  {
    id: "caesar",
    name: "Caesar",
    description: "Shift each letter by a fixed amount",
    preservesLength: true,
    needsShift: true,
  },
  {
    id: "rot13",
    name: "ROT13",
    description: "Caesar shift of 13",
    preservesLength: true,
  },
  {
    id: "atbash",
    name: "Atbash",
    description: "Mirror the alphabet (A↔Z)",
    preservesLength: true,
  },
  {
    id: "vigenere",
    name: "Vigenère",
    description: "Polyalphabetic cipher with a keyword",
    preservesLength: true,
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
};
