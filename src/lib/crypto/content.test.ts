import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  contentAad,
  decryptContent,
  decryptLetterBody,
  encryptContent,
  encryptLetterBody,
  isEncryptedContent,
  resetContentEncryptionKeyCache,
} from "./content";

describe("content encryption", () => {
  beforeEach(() => {
    process.env.CONTENT_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
    resetContentEncryptionKeyCache();
  });

  afterEach(() => {
    resetContentEncryptionKeyCache();
  });

  it("round-trips plaintext with AAD", () => {
    const aad = contentAad("letter_1", "body");
    const stored = encryptContent("Dear forty,", aad);
    expect(isEncryptedContent(stored)).toBe(true);
    expect(stored).not.toContain("Dear forty,");
    expect(decryptContent(stored, aad)).toBe("Dear forty,");
  });

  it("fails when AAD does not match", () => {
    const stored = encryptLetterBody("letter_1", "secret");
    expect(() => decryptLetterBody("letter_2", stored)).toThrow();
  });

  it("passes through legacy plaintext", () => {
    expect(decryptContent("old draft text", contentAad("x", "body"))).toBe(
      "old draft text",
    );
  });

  it("leaves empty strings unencrypted", () => {
    expect(encryptContent("", contentAad("x", "body"))).toBe("");
    expect(decryptContent("", contentAad("x", "body"))).toBe("");
  });
});
