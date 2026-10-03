import {
  absoluteUrl,
  MS_PER_DAY,
  wrapTransactionalHtml,
  type ComposedEmail,
} from "./email-layout";

/** Days before unlock when the hygiene reminder becomes eligible. */
export const STALE_REMINDER_DAYS_BEFORE = 30;

export type StaleEmailInput = {
  email: string;
  targetAge: number;
  daysUntilUnlock: number;
};

export function daysUntilUnlockInstant(unlockAt: Date, now: Date): number {
  return (unlockAt.getTime() - now.getTime()) / MS_PER_DAY;
}

/** True once now is within ~30 days of unlock, and unlock has not yet arrived. */
export function isInStaleReminderWindow(unlockAt: Date, now: Date): boolean {
  const msUntil = unlockAt.getTime() - now.getTime();
  if (msUntil <= 0) return false;
  const reminderAt = unlockAt.getTime() - STALE_REMINDER_DAYS_BEFORE * MS_PER_DAY;
  return now.getTime() >= reminderAt;
}

export function shouldSendStaleReminder(args: {
  staleEmailSentAt: Date | null;
  unlockAt: Date;
  now: Date;
}): boolean {
  return args.staleEmailSentAt === null && isInStaleReminderWindow(args.unlockAt, args.now);
}

export function composeStaleReminderEmail(input: StaleEmailInput): ComposedEmail {
  const ctaUrl = absoluteUrl("/settings");
  const days = Math.max(1, Math.round(input.daysUntilUnlock));
  const subject = `Quick check — a letter unlocks in about ${days} days`;
  const text = [
    `A sealed letter to age ${input.targetAge} unlocks in about ${days} days.`,
    ``,
    `This is only a reachability check — nothing from the letter is here.`,
    `If this inbox still reaches you, you’re set. If not, update your email in Settings before that birthday.`,
    ``,
    ctaUrl,
    ``,
    `— Age Census`,
  ].join("\n");

  const html = wrapTransactionalHtml({
    title: "Still the right inbox?",
    paragraphs: [
      `A sealed letter to age ${input.targetAge} unlocks in about ${days} days.`,
      `This is only a reachability check — nothing from the letter is here. If this address still finds you, you’re set.`,
    ],
    footnote: "If it doesn’t, update your email in Settings before that birthday.",
    ctaLabel: "Review email in Settings",
    ctaUrl,
  });

  return { to: input.email, subject, text, html, ctaUrl };
}
