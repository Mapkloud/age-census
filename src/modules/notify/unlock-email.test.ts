import { describe, expect, it } from "vitest";
import {
  composeUnlockEmail,
  shouldSendUnlockEmail,
  unlockOpenUrl,
} from "./unlock-email";

describe("composeUnlockEmail", () => {
  it("builds a warm invite with deep link and no letter body", () => {
    const mail = composeUnlockEmail({
      email: "you@example.com",
      letterId: "letter_abc",
      targetAge: 40,
    });

    expect(mail.to).toBe("you@example.com");
    expect(mail.subject).toMatch(/age 40/i);
    expect(mail.openUrl).toBe(unlockOpenUrl("letter_abc"));
    expect(mail.text).toContain(mail.openUrl);
    expect(mail.text).toMatch(/waiting|ready to open/i);
    expect(mail.html).toContain(mail.openUrl);
    expect(mail.html).toMatch(/Open your letter/);

    // No spoilers from a sealed letter (brand name “Age Census” is fine).
    expect(mail.text).not.toMatch(/\bfear\b|\blove\b|\bwork\b|\bhome\b|\bregret\b/i);
    expect(mail.html.toLowerCase()).not.toContain("fear");
    expect(mail.html).not.toMatch(/letter body|sealed text/i);
  });
});

describe("shouldSendUnlockEmail", () => {
  it("sends only when unlocked and not yet emailed", () => {
    expect(
      shouldSendUnlockEmail({ unlockEmailSentAt: null, unlocked: true }),
    ).toBe(true);
    expect(
      shouldSendUnlockEmail({ unlockEmailSentAt: null, unlocked: false }),
    ).toBe(false);
    expect(
      shouldSendUnlockEmail({
        unlockEmailSentAt: new Date("2026-01-01"),
        unlocked: true,
      }),
    ).toBe(false);
  });
});
