import { describe, expect, it } from "vitest";
import { composeEmailChangeVerification } from "./email-change-email";

describe("composeEmailChangeVerification", () => {
  it("builds verification mail for the new address with the confirm URL", () => {
    const url = "http://localhost:3000/verify-email?token=deadbeef";
    const mail = composeEmailChangeVerification({
      newEmail: "new@example.com",
      url,
    });

    expect(mail.to).toBe("new@example.com");
    expect(mail.subject).toMatch(/confirm/i);
    expect(mail.ctaUrl).toBe(url);
    expect(mail.text).toContain(url);
    expect(mail.text).toMatch(/current address stays active/i);
    expect(mail.html).toContain(url);
    expect(mail.html).toMatch(/Confirm email/);
  });
});
