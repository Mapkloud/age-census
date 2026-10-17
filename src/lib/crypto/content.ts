import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const VERSION_PREFIX = "v1:";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

export type ContentAadKind = "body" | `census:${string}`;

export function contentAad(letterId: string, kind: ContentAadKind): string {
  return `letter:${letterId}|${kind}`;
}

function resolveKeyBytes(): Buffer {
  const raw = process.env.CONTENT_ENCRYPTION_KEY?.trim();
  if (raw) {
    const fromB64 = Buffer.from(raw, "base64");
    if (fromB64.length === KEY_LENGTH) return fromB64;
    const fromHex = Buffer.from(raw, "hex");
    if (fromHex.length === KEY_LENGTH) return fromHex;
    throw new Error(
      "CONTENT_ENCRYPTION_KEY must be 32 bytes (base64 or hex). Generate with: openssl rand -base64 32",
    );
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("CONTENT_ENCRYPTION_KEY is required in production");
  }

  const fallback = process.env.AUTH_SECRET?.trim();
  if (!fallback) {
    throw new Error(
      "Set CONTENT_ENCRYPTION_KEY (or AUTH_SECRET for local-only fallback) to encrypt letter content",
    );
  }

  // Local convenience only — not for production.
  return createHash("sha256")
    .update(`age-census-content-v1:${fallback}`)
    .digest();
}

let cachedKey: Buffer | null = null;

function keyBytes(): Buffer {
  if (!cachedKey) cachedKey = resolveKeyBytes();
  return cachedKey;
}

/** Reset cached key (tests). */
export function resetContentEncryptionKeyCache(): void {
  cachedKey = null;
}

export function isEncryptedContent(value: string): boolean {
  return value.startsWith(VERSION_PREFIX);
}

/**
 * Encrypt plaintext with AES-256-GCM.
 * Stored form: `v1:` + base64(iv || ciphertext || authTag)
 * Empty string stays empty (nothing to protect).
 */
export function encryptContent(plaintext: string, aad: string): string {
  if (plaintext === "") return "";
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", keyBytes(), iv);
  cipher.setAAD(Buffer.from(aad, "utf8"));
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return VERSION_PREFIX + Buffer.concat([iv, ciphertext, tag]).toString("base64");
}

/**
 * Decrypt a stored field. Legacy plaintext (no `v1:` prefix) is returned as-is
 * so existing rows keep working until re-saved or migrated.
 */
export function decryptContent(stored: string, aad: string): string {
  if (stored === "" || !isEncryptedContent(stored)) {
    return stored;
  }

  const payload = Buffer.from(stored.slice(VERSION_PREFIX.length), "base64");
  if (payload.length < IV_LENGTH + AUTH_TAG_LENGTH + 1) {
    throw new Error("Invalid encrypted content payload");
  }

  const iv = payload.subarray(0, IV_LENGTH);
  const tag = payload.subarray(payload.length - AUTH_TAG_LENGTH);
  const ciphertext = payload.subarray(IV_LENGTH, payload.length - AUTH_TAG_LENGTH);
  const decipher = createDecipheriv("aes-256-gcm", keyBytes(), iv);
  decipher.setAAD(Buffer.from(aad, "utf8"));
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

export function encryptLetterBody(letterId: string, plaintext: string): string {
  return encryptContent(plaintext, contentAad(letterId, "body"));
}

export function decryptLetterBody(letterId: string, stored: string): string {
  return decryptContent(stored, contentAad(letterId, "body"));
}

export function encryptCensusValue(
  letterId: string,
  key: string,
  plaintext: string,
): string {
  return encryptContent(plaintext, contentAad(letterId, `census:${key}`));
}

export function decryptCensusValue(
  letterId: string,
  key: string,
  stored: string,
): string {
  return decryptContent(stored, contentAad(letterId, `census:${key}`));
}

export function decryptAnswers(
  letterId: string,
  answers: Array<{ key: string; value: string }>,
): Array<{ key: string; value: string }> {
  return answers.map((answer) => ({
    key: answer.key,
    value: decryptCensusValue(letterId, answer.key, answer.value),
  }));
}
