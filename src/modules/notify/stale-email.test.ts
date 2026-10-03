import { describe, expect, it } from "vitest";
import {
  composeStaleReminderEmail,
  isInStaleReminderWindow,
  shouldSendStaleReminder,
  STALE_REMINDER_DAYS_BEFORE,
} from "./stale-email";
import { MS_PER_DAY } from "./email-layout";

describe("isInStaleReminderWindow", () => {
  const unlockAt = new Date("2030-05-19T00:00:00.000Z");

  it("is false more than 30 days before unlock", () => {
    const now = new Date(unlockAt.getTime() - (STALE_REMINDER_DAYS_BEFORE + 1) * MS_PER_DAY);
    expect(isInStaleReminderWindow(unlockAt, now)).toBe(false);
  });

  it("is true inside the 30-day window", () => {
    const now = new Date(unlockAt.getTime() - 15 * MS_PER_DAY);
    expect(isInStaleReminderWindow(unlockAt, now)).toBe(true);
  });

  it("is false on or after unlock", () => {
    expect(isInStaleReminderWindow(unlockAt, unlockAt)).toBe(false);
    expect(
      isInStaleReminderWindow(unlockAt, new Date(unlockAt.getTime() + MS_PER_DAY)),
    ).toBe(false);
  });
});

describe("shouldSendStaleReminder", () => {
  const unlockAt = new Date("2030-05-19T00:00:00.000Z");
  const now = new Date(unlockAt.getTime() - 20 * MS_PER_DAY);

  it("sends once while in window", () => {
    expect(
      shouldSendStaleReminder({ staleEmailSentAt: null, unlockAt, now }),
    ).toBe(true);
    expect(
      shouldSendStaleReminder({
        staleEmailSentAt: new Date("2030-04-01"),
        unlockAt,
        now,
      }),
    ).toBe(false);
  });
});

describe("composeStaleReminderEmail", () => {
  it("is hygiene-focused with settings link and no spoilers", () => {
    const mail = composeStaleReminderEmail({
      email: "you@example.com",
      targetAge: 40,
      daysUntilUnlock: 30,
    });
    expect(mail.subject).toMatch(/30 days/i);
    expect(mail.text).toMatch(/reachability|inbox|Settings/i);
    expect(mail.ctaUrl).toContain("/settings");
    expect(mail.html).toContain("/settings");
    expect(mail.text).not.toMatch(/\bfear\b|\blove\b|\bregret\b/i);
  });
});
