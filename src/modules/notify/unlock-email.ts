import {
  absoluteUrl,
  wrapTransactionalHtml,
  type ComposedEmail,
} from "./email-layout";

export type UnlockEmailInput = {
  email: string;
  letterId: string;
  targetAge: number;
};

export type UnlockEmailContent = ComposedEmail & { openUrl: string };

export function unlockOpenUrl(letterId: string): string {
  return absoluteUrl(`/open/${letterId}`);
}

/** Pure composer — no letter body, census, or spoilers. */
export function composeUnlockEmail(input: UnlockEmailInput): UnlockEmailContent {
  const openUrl = unlockOpenUrl(input.letterId);
  const subject = `A letter is waiting for you at age ${input.targetAge}`;
  const text = [
    `Happy birthday.`,
    ``,
    `You’ve reached age ${input.targetAge}. Someone who was younger sealed a letter for this day — and it’s ready to open.`,
    ``,
    `Come open it on Age Census (nothing of the letter is in this email):`,
    openUrl,
    ``,
    `— Age Census`,
  ].join("\n");

  const html = wrapTransactionalHtml({
    title: "A letter is waiting.",
    paragraphs: [
      `You’ve reached age ${input.targetAge}. Someone who was younger sealed a letter for this birthday — and it’s ready to open on Age Census.`,
    ],
    footnote: "We won’t put any of it here. Opening happens there, after you sign in.",
    ctaLabel: "Open your letter",
    ctaUrl: openUrl,
  });

  return {
    to: input.email,
    subject,
    text,
    html,
    ctaUrl: openUrl,
    openUrl,
  };
}

export function shouldSendUnlockEmail(args: {
  unlockEmailSentAt: Date | null;
  unlocked: boolean;
}): boolean {
  return args.unlocked && args.unlockEmailSentAt === null;
}
