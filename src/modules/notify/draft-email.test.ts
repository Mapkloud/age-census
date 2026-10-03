import { describe, expect, it } from "vitest";
import {
  composeDraftReminderEmail,
  DRAFT_REMINDER_AFTER_DAYS,
  shouldSendDraftReminder,
} from "./draft-email";
import { MS_PER_DAY } from "./email-layout";

describe("shouldSendDraftReminder", () => {
  const now = new Date("2026-10-03T12:00:00.000Z");

  it("waits until the draft has been idle long enough", () => {
    expect(
      shouldSendDraftReminder({
        draftReminderSentAt: null,
        updatedAt: new Date(now.getTime() - (DRAFT_REMINDER_AFTER_DAYS - 1) * MS_PER_DAY),
        now,
      }),
    ).toBe(false);
    expect(
      shouldSendDraftReminder({
        draftReminderSentAt: null,
        updatedAt: new Date(now.getTime() - DRAFT_REMINDER_AFTER_DAYS * MS_PER_DAY),
        now,
      }),
    ).toBe(true);
  });

  it("is idempotent after one send", () => {
    expect(
      shouldSendDraftReminder({
        draftReminderSentAt: new Date("2026-09-01"),
        updatedAt: new Date(now.getTime() - 30 * MS_PER_DAY),
        now,
      }),
    ).toBe(false);
  });
});

describe("composeDraftReminderEmail", () => {
  it("points at the write route without letter content", () => {
    const mail = composeDraftReminderEmail({
      email: "you@example.com",
      targetAge: 50,
    });
    expect(mail.subject).toMatch(/age 50/i);
    expect(mail.ctaUrl).toContain("/write/50");
    expect(mail.text).toMatch(/draft|chair|waiting/i);
    expect(mail.text).not.toMatch(/\bfear\b|\blove\b|\bregret\b/i);
  });
});
