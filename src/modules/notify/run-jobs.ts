import type { PrismaClient } from "@prisma/client";
import { processDraftReminders } from "./draft-job";
import type { JobCounts } from "./stale-job";
import { processStaleUnlockReminders } from "./stale-job";
import { processBirthdayUnlockEmails } from "./unlock-job";

export type NotifyJobsResult = {
  unlock: JobCounts;
  stale: JobCounts;
  draft: JobCounts;
};

/** Run all email-as-backup notify jobs (order: stale → unlock → draft). */
export async function processNotifyJobs(
  db: PrismaClient,
  now: Date = new Date(),
): Promise<NotifyJobsResult> {
  const stale = await processStaleUnlockReminders(db, now);
  const unlock = await processBirthdayUnlockEmails(db, now);
  const draft = await processDraftReminders(db, now);
  return { unlock, stale, draft };
}
