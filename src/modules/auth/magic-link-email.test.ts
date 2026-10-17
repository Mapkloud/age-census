import { describe, expect, it } from "vitest";
import { composeMagicLinkEmail } from "./magic-link-email";

describe("composeMagicLinkEmail", () => {
  it("builds subject, text, and HTML with the magic-link URL", () => {
    const url =
      "http://localhost:3000/api/auth/callback/resend?token=abc&email=you%40example.com";
    const mail = composeMagicLinkEmail({
      email: "you@example.com",
      url,
    });

    expect(mail.to).toBe("you@example.com");
    expect(mail.subject).toMatch(/sign in/i);
    expect(mail.ctaUrl).toBe(url);
    expect(mail.text).toContain(url);
    expect(mail.text).toMatch(/ignore/i);
    expect(mail.html).toContain(url);
    expect(mail.html).toMatch(/Sign in/);
  });
});
