import type { PrismaClient } from "@prisma/client";
import { sendEmail } from "@/lib/mail";
import { getUnlockInstant } from "@/modules/age";
import {
  composeStaleReminderEmail,
  daysUntilUnlockInstant,
  shouldSendStaleReminder,
} from "./stale-email";

export type JobCounts = {
  scanned: number;
  sent: number;
  skipped: number;
  failed: number;
};

/**
 * ~30-day pre-unlock hygiene reminder. Idempotent via staleEmailSentAt.
 * Eligible from 30 days before unlock until unlock (not after).
 */
export async function processStaleUnlockReminders(
  db: PrismaClient,
  now: Date = new Date(),
): Promise<JobCounts> {
  const candidates = await db.letter.findMany({
    where: {
      staleEmailSentAt: null,
      status: "SEALED",
      user: {
        birthDate: { not: null },
        timezone: { not: null },
      },
    },
    select: {
      id: true,
      targetAge: true,
      staleEmailSentAt: true,
      user: {
        select: {
          email: true,
          birthDate: true,
          timezone: true,
        },
      },
    },
  });

  const result: JobCounts = {
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

    const unlockAt = getUnlockInstant(birthDate, timezone, letter.targetAge);
    if (
      !shouldSendStaleReminder({
        staleEmailSentAt: letter.staleEmailSentAt,
        unlockAt,
        now,
      })
    ) {
      result.skipped += 1;
      continue;
    }

    const claimed = await db.letter.updateMany({
      where: {
        id: letter.id,
        staleEmailSentAt: null,
        status: "SEALED",
      },
      data: { staleEmailSentAt: now },
    });
    if (claimed.count === 0) {
      result.skipped += 1;
      continue;
    }

    const content = composeStaleReminderEmail({
      email,
      targetAge: letter.targetAge,
      daysUntilUnlock: daysUntilUnlockInstant(unlockAt, now),
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
        data: { staleEmailSentAt: null },
      });
      result.failed += 1;
      console.error("[notify] stale reminder failed", letter.id, delivery.error);
      continue;
    }

    result.sent += 1;
  }

  return result;
}
