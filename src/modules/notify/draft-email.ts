import {
  absoluteUrl,
  MS_PER_DAY,
  wrapTransactionalHtml,
  type ComposedEmail,
} from "./email-layout";

/** Idle days before a draft gets a one-time “chair waiting” reminder. */
export const DRAFT_REMINDER_AFTER_DAYS = 7;

export type DraftEmailInput = {
  email: string;
  targetAge: number;
};

export function shouldSendDraftReminder(args: {
  draftReminderSentAt: Date | null;
  updatedAt: Date;
  now: Date;
}): boolean {
  if (args.draftReminderSentAt !== null) return false;
  return (
    args.now.getTime() - args.updatedAt.getTime() >=
    DRAFT_REMINDER_AFTER_DAYS * MS_PER_DAY
  );
}

export function composeDraftReminderEmail(input: DraftEmailInput): ComposedEmail {
  const ctaUrl = absoluteUrl(`/write/${input.targetAge}`);
  const subject = `A draft for age ${input.targetAge} is still open`;
  const text = [
    `There’s still an unsealed draft for age ${input.targetAge} on your map.`,
    ``,
    `No rush — seal it when it’s ready, or leave the chair as it is.`,
    ``,
    ctaUrl,
    ``,
    `— Age Census`,
  ].join("\n");

  const html = wrapTransactionalHtml({
    title: "A chair is still waiting.",
    paragraphs: [
      `There’s still an unsealed draft for age ${input.targetAge} on your map.`,
      `No rush — seal it when it’s ready, or leave the chair as it is.`,
    ],
    ctaLabel: "Return to your draft",
    ctaUrl,
  });

  return { to: input.email, subject, text, html, ctaUrl };
}
