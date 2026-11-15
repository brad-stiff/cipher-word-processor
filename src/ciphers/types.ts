export type CipherId = "caesar" | "rot13" | "atbash" | "vigenere";

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
  needsShift?: boolean;
  needsKeyword?: boolean;
}

export const CIPHERS: CipherDefinition[] = [
  {
    id: "caesar",
    name: "Caesar",
    description: "Shift each letter by a fixed amount",
    needsShift: true,
  },
  {
    id: "rot13",
    name: "ROT13",
    description: "Caesar shift of 13",
  },
  {
    id: "atbash",
    name: "Atbash",
    description: "Mirror the alphabet (A↔Z)",
  },
  {
    id: "vigenere",
    name: "Vigenère",
    description: "Polyalphabetic cipher with a keyword",
    needsKeyword: true,
  },
];

export const DEFAULT_SETTINGS: CipherSettings = {
  id: "caesar",
  shift: 3,
  keyword: "KEY",
};
