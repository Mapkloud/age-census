import type { PrismaClient } from "@prisma/client";
import { sendEmail } from "@/lib/mail";
import {
  composeDraftReminderEmail,
  DRAFT_REMINDER_AFTER_DAYS,
  shouldSendDraftReminder,
} from "./draft-email";
import { MS_PER_DAY } from "./email-layout";
import type { JobCounts } from "./stale-job";

/**
 * One-time reminder for idle unsealed drafts. Idempotent via draftReminderSentAt.
 */
export async function processDraftReminders(
  db: PrismaClient,
  now: Date = new Date(),
): Promise<JobCounts> {
  const cutoff = new Date(now.getTime() - DRAFT_REMINDER_AFTER_DAYS * MS_PER_DAY);
  const candidates = await db.letter.findMany({
    where: {
      status: "DRAFT",
      draftReminderSentAt: null,
      updatedAt: { lte: cutoff },
      user: {
        birthDate: { not: null },
        timezone: { not: null },
      },
    },
    select: {
      id: true,
      targetAge: true,
      updatedAt: true,
      draftReminderSentAt: true,
      user: {
        select: {
          email: true,
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
    const email = letter.user.email;
    if (!email) {
      result.skipped += 1;
      continue;
    }

    if (
      !shouldSendDraftReminder({
        draftReminderSentAt: letter.draftReminderSentAt,
        updatedAt: letter.updatedAt,
        now,
      })
    ) {
      result.skipped += 1;
      continue;
    }

    const claimed = await db.letter.updateMany({
      where: {
        id: letter.id,
        status: "DRAFT",
        draftReminderSentAt: null,
      },
      data: { draftReminderSentAt: now },
    });
    if (claimed.count === 0) {
      result.skipped += 1;
      continue;
    }

    const content = composeDraftReminderEmail({
      email,
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
        data: { draftReminderSentAt: null },
      });
      result.failed += 1;
      console.error("[notify] draft reminder failed", letter.id, delivery.error);
      continue;
    }

    result.sent += 1;
  }

  return result;
}
