import { createHash, randomBytes } from "node:crypto";

/** One hour — same order of magnitude as Auth.js email magic links. */
export const EMAIL_CHANGE_TOKEN_TTL_MS = 60 * 60 * 1000;

export type EmailChangeRequestError =
  | "empty"
  | "invalid"
  | "unchanged"
  | "taken";

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmailShape(email: string): boolean {
  return email.length > 0 && email.length <= 254 && EMAIL_SHAPE.test(email);
}

/**
 * Validates a requested new address. Returns the normalized email or a
 * stable error code for UI messaging.
 */
export function validateNewEmail(args: {
  currentEmail: string;
  newEmail: string;
  takenByOtherUser: boolean;
}): { ok: true; email: string } | { ok: false; error: EmailChangeRequestError } {
  const email = normalizeEmail(args.newEmail);
  if (!email) {
    return { ok: false, error: "empty" };
  }
  if (!isValidEmailShape(email)) {
    return { ok: false, error: "invalid" };
  }
  if (email === normalizeEmail(args.currentEmail)) {
    return { ok: false, error: "unchanged" };
  }
  if (args.takenByOtherUser) {
    return { ok: false, error: "taken" };
  }
  return { ok: true, email };
}

export function emailChangeExpiresAt(now = new Date()): Date {
  return new Date(now.getTime() + EMAIL_CHANGE_TOKEN_TTL_MS);
}

export function isEmailChangeExpired(expires: Date, now = new Date()): boolean {
  return expires.getTime() <= now.getTime();
}

export function hashEmailChangeToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

export function generateEmailChangeToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("hex");
  return { raw, hash: hashEmailChangeToken(raw) };
}

/** Auth.js email providers store the address as providerAccountId. */
export const EMAIL_AUTH_PROVIDERS = ["resend", "nodemailer", "sendgrid", "email"] as const;

export const emailChangeErrorCopy: Record<EmailChangeRequestError, string> = {
  empty: "Enter the new email address.",
  invalid: "That doesn’t look like a valid email address.",
  unchanged: "That’s already your current address.",
  taken: "That address is already registered to another account.",
};

/** Stable copy for settings query-string feedback. */
export function emailChangeFeedbackMessage(
  status: string | undefined,
  reason: string | undefined,
): { tone: "info" | "warning" | "error"; title: string; body: string } | null {
  if (!status) return null;
  if (status === "sent") {
    return {
      tone: "info",
      title: "Check the new inbox",
      body: "We sent a verification link to the new address. Your current email stays active until you confirm.",
    };
  }
  if (status === "cancelled") {
    return {
      tone: "info",
      title: "Change cancelled",
      body: "No email change is pending. Your current address is unchanged.",
    };
  }
  if (status === "verified") {
    return {
      tone: "info",
      title: "Email updated",
      body: "Your new address is now primary. Sign-in links will go there from now on.",
    };
  }
  if (status === "error") {
    const code = reason as EmailChangeRequestError;
    return {
      tone: "error",
      title: "Couldn’t start the change",
      body: emailChangeErrorCopy[code] ?? "Something went wrong. Try again.",
    };
  }
  return null;
}
