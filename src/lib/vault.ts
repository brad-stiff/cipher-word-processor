import {
  normalizeCipherSettings,
  type CipherSettings,
} from "../ciphers";

export const VAULT_FORMAT = "cipher-word-processor";
export const VAULT_VERSION = 1;
export const VAULT_EXTENSION = "cwp";

const PBKDF2_ITERATIONS = 310_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;

export interface VaultPayload {
  text: string;
  settings: CipherSettings;
}

export interface VaultFile {
  format: typeof VAULT_FORMAT;
  version: number;
  encrypted: true;
  kdf: "PBKDF2-SHA256";
  iterations: number;
  salt: string;
  iv: string;
  data: string;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function asBufferSource(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy;
}

export function isVaultFile(contents: string): boolean {
  const trimmed = contents.trim();
  if (!trimmed.startsWith("{")) return false;
  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>;
    return (
      parsed.format === VAULT_FORMAT &&
      parsed.encrypted === true &&
      typeof parsed.data === "string" &&
      typeof parsed.salt === "string" &&
      typeof parsed.iv === "string"
    );
  } catch {
    return false;
  }
}

async function deriveKey(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: asBufferSource(salt),
      iterations,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function sealVault(
  payload: VaultPayload,
  password: string,
): Promise<string> {
  if (!password) {
    throw new Error("Password is required to save a locked document.");
  }

  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveKey(password, salt, PBKDF2_ITERATIONS);
  const plaintext = new TextEncoder().encode(
    JSON.stringify({
      text: payload.text,
      settings: payload.settings,
    }),
  );
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: asBufferSource(iv) },
    key,
    plaintext,
  );

  const file: VaultFile = {
    format: VAULT_FORMAT,
    version: VAULT_VERSION,
    encrypted: true,
    kdf: "PBKDF2-SHA256",
    iterations: PBKDF2_ITERATIONS,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    data: bytesToBase64(new Uint8Array(encrypted)),
  };

  return `${JSON.stringify(file, null, 2)}\n`;
}

export async function unlockVault(
  contents: string,
  password: string,
): Promise<VaultPayload> {
  let parsed: VaultFile;
  try {
    parsed = JSON.parse(contents.trim()) as VaultFile;
  } catch {
    throw new Error("Not a valid locked document.");
  }

  if (
    parsed.format !== VAULT_FORMAT ||
    parsed.encrypted !== true ||
    typeof parsed.salt !== "string" ||
    typeof parsed.iv !== "string" ||
    typeof parsed.data !== "string"
  ) {
    throw new Error("Not a valid locked document.");
  }

  const iterations =
    typeof parsed.iterations === "number" && parsed.iterations > 0
      ? parsed.iterations
      : PBKDF2_ITERATIONS;

  const salt = base64ToBytes(parsed.salt);
  const iv = base64ToBytes(parsed.iv);
  const data = base64ToBytes(parsed.data);
  const key = await deriveKey(password, salt, iterations);

  let decrypted: ArrayBuffer;
  try {
    decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: asBufferSource(iv) },
      key,
      asBufferSource(data),
    );
  } catch {
    throw new Error("Incorrect password.");
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(new TextDecoder().decode(decrypted)) as Record<
      string,
      unknown
    >;
  } catch {
    throw new Error("Locked document contents are corrupt.");
  }

  return {
    text: typeof payload.text === "string" ? payload.text : "",
    settings: normalizeCipherSettings(payload.settings),
  };
}

export function pathLooksLocked(path: string | null): boolean {
  if (!path) return false;
  return path.toLowerCase().endsWith(`.${VAULT_EXTENSION}`);
}
