import {
  wrapTransactionalHtml,
  type ComposedEmail,
} from "@/modules/notify/email-layout";

export type MagicLinkEmailInput = {
  email: string;
  url: string;
};

/** Pure composer for Auth.js magic-link sign-in mail. */
export function composeMagicLinkEmail(
  input: MagicLinkEmailInput,
): ComposedEmail {
  const subject = "Sign in to Age Census";
  const text = [
    "Sign in to Age Census",
    "",
    "Use this link to sign in (it expires soon):",
    input.url,
    "",
    "If you didn’t request this, you can ignore this email.",
    "",
    "— Age Census",
  ].join("\n");

  const html = wrapTransactionalHtml({
    title: "Sign in to Age Census",
    paragraphs: [
      "Use the button below to sign in. This link expires soon and can only be used once.",
    ],
    footnote: "If you didn’t request this, you can ignore this email.",
    ctaLabel: "Sign in",
    ctaUrl: input.url,
  });

  return {
    to: input.email,
    subject,
    text,
    html,
    ctaUrl: input.url,
  };
}
