import { describe, expect, it } from "vitest";
import {
  emailChangeExpiresAt,
  generateEmailChangeToken,
  hashEmailChangeToken,
  isEmailChangeExpired,
  normalizeEmail,
  validateNewEmail,
} from "./index";

describe("normalizeEmail", () => {
  it("trims and lowercases", () => {
    expect(normalizeEmail("  Alex@Example.COM ")).toBe("alex@example.com");
  });
});

describe("validateNewEmail", () => {
  it("accepts a free, different address", () => {
    expect(
      validateNewEmail({
        currentEmail: "old@example.com",
        newEmail: " New@Example.com ",
        takenByOtherUser: false,
      }),
    ).toEqual({ ok: true, email: "new@example.com" });
  });

  it("rejects empty, invalid, unchanged, and taken", () => {
    expect(
      validateNewEmail({
        currentEmail: "a@b.co",
        newEmail: "  ",
        takenByOtherUser: false,
      }),
    ).toEqual({ ok: false, error: "empty" });

    expect(
      validateNewEmail({
        currentEmail: "a@b.co",
        newEmail: "not-an-email",
        takenByOtherUser: false,
      }),
    ).toEqual({ ok: false, error: "invalid" });

    expect(
      validateNewEmail({
        currentEmail: "Same@Example.com",
        newEmail: "same@example.com",
        takenByOtherUser: false,
      }),
    ).toEqual({ ok: false, error: "unchanged" });

    expect(
      validateNewEmail({
        currentEmail: "a@b.co",
        newEmail: "taken@example.com",
        takenByOtherUser: true,
      }),
    ).toEqual({ ok: false, error: "taken" });
  });
});

describe("email change tokens", () => {
  it("hashes deterministically and generates unique raw tokens", () => {
    const a = generateEmailChangeToken();
    const b = generateEmailChangeToken();
    expect(a.raw).not.toBe(b.raw);
    expect(a.hash).toBe(hashEmailChangeToken(a.raw));
    expect(a.hash).not.toBe(a.raw);
  });

  it("expires after the TTL", () => {
    const now = new Date("2026-10-03T12:00:00.000Z");
    const expires = emailChangeExpiresAt(now);
    expect(isEmailChangeExpired(expires, now)).toBe(false);
    expect(isEmailChangeExpired(expires, new Date(expires.getTime()))).toBe(true);
    expect(
      isEmailChangeExpired(expires, new Date(expires.getTime() + 1)),
    ).toBe(true);
  });
});
