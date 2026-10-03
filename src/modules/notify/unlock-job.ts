import type { PrismaClient } from "@prisma/client";
import { sendEmail } from "@/lib/mail";
import { isLetterUnlocked } from "@/modules/age";
import type { JobCounts } from "./stale-job";
import { composeUnlockEmail, shouldSendUnlockEmail } from "./unlock-email";

export type UnlockJobResult = JobCounts;

/**
 * Find sealed/unlocked letters whose birthday has arrived and send the
 * one-time “letter waiting” email. Idempotent via unlockEmailSentAt.
 */
export async function processBirthdayUnlockEmails(
  db: PrismaClient,
  now: Date = new Date(),
): Promise<UnlockJobResult> {
  const candidates = await db.letter.findMany({
    where: {
      unlockEmailSentAt: null,
      status: { in: ["SEALED", "UNLOCKED"] },
      user: {
        birthDate: { not: null },
        timezone: { not: null },
      },
    },
    select: {
      id: true,
      targetAge: true,
      status: true,
      unlockEmailSentAt: true,
      user: {
        select: {
          email: true,
          birthDate: true,
          timezone: true,
        },
      },
    },
  });

  const result: UnlockJobResult = {
    scanned: candidates.length,
    sent: 0,
    skipped: 0,
    failed: 0,
  };

  for (const letter of candidates) {
    const birthDate = letter.user.birthDate;
    const timezone = letter.user.timezone;
    const email = letter.user.email;
    if (!birthDate || !timezone || !email) {
      result.skipped += 1;
      continue;
    }

    const unlocked = isLetterUnlocked(birthDate, timezone, letter.targetAge, now);
    if (
      !shouldSendUnlockEmail({
        unlockEmailSentAt: letter.unlockEmailSentAt,
        unlocked,
      })
    ) {
      result.skipped += 1;
      continue;
    }

    // Claim first so concurrent cron runs cannot double-send.
    const claimed = await db.letter.updateMany({
      where: {
        id: letter.id,
        unlockEmailSentAt: null,
        status: { in: ["SEALED", "UNLOCKED"] },
      },
      data: {
        unlockEmailSentAt: now,
        status: "UNLOCKED",
      },
    });
    if (claimed.count === 0) {
      result.skipped += 1;
      continue;
    }

    const content = composeUnlockEmail({
      email,
      letterId: letter.id,
      targetAge: letter.targetAge,
    });
    const delivery = await sendEmail({
      to: content.to,
      subject: content.subject,
      text: content.text,
      html: content.html,
    });

    if (!delivery.ok) {
      await db.letter.update({
        where: { id: letter.id },
        data: { unlockEmailSentAt: null },
      });
      result.failed += 1;
      console.error("[notify] unlock email failed", letter.id, delivery.error);
      continue;
    }

    result.sent += 1;
  }

  return result;
}
