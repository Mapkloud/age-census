import {
  wrapTransactionalHtml,
  type ComposedEmail,
} from "@/modules/notify/email-layout";

export type EmailChangeEmailInput = {
  newEmail: string;
  url: string;
};

/** Pure composer for change-email verification mail. */
export function composeEmailChangeVerification(
  input: EmailChangeEmailInput,
): ComposedEmail {
  const subject = "Confirm your new Age Census email";
  const text = [
    "Confirm your new email",
    "",
    "Someone (hopefully you) asked to change the Age Census account email to this address.",
    "Confirm with this link (it expires in about an hour):",
    input.url,
    "",
    "If you didn’t request this, you can ignore this email. Your current address stays active until you confirm.",
    "",
    "— Age Census",
  ].join("\n");

  const html = wrapTransactionalHtml({
    title: "Confirm your new email",
    paragraphs: [
      "Someone (hopefully you) asked to change the Age Census account email to this address.",
      "Confirm below. Your current address stays active until you do.",
    ],
    footnote: "This link expires in about an hour. If you didn’t request this, ignore the message.",
    ctaLabel: "Confirm email",
    ctaUrl: input.url,
  });

  return {
    to: input.newEmail,
    subject,
    text,
    html,
    ctaUrl: input.url,
  };
}
