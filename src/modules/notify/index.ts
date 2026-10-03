import { sendEmail } from "@/lib/mail";
import { composeDraftReminderEmail } from "./draft-email";
import { composeStaleReminderEmail } from "./stale-email";
import { composeUnlockEmail } from "./unlock-email";

export {
  composeUnlockEmail,
  shouldSendUnlockEmail,
  unlockOpenUrl,
} from "./unlock-email";
export {
  composeStaleReminderEmail,
  shouldSendStaleReminder,
  isInStaleReminderWindow,
  STALE_REMINDER_DAYS_BEFORE,
} from "./stale-email";
export {
  composeDraftReminderEmail,
  shouldSendDraftReminder,
  DRAFT_REMINDER_AFTER_DAYS,
} from "./draft-email";
export { processBirthdayUnlockEmails } from "./unlock-job";
export { processStaleUnlockReminders } from "./stale-job";
export { processDraftReminders } from "./draft-job";
export { processNotifyJobs } from "./run-jobs";
export type { UnlockJobResult } from "./unlock-job";
export type { JobCounts } from "./stale-job";
export type { NotifyJobsResult } from "./run-jobs";

export async function notifyUnlock(args: {
  email: string;
  letterId: string;
  targetAge: number;
}): Promise<void> {
  const content = composeUnlockEmail(args);
  const result = await sendEmail({
    to: content.to,
    subject: content.subject,
    text: content.text,
    html: content.html,
  });
  if (!result.ok) {
    throw new Error(result.error);
  }
}

export async function remindStaleUnlockEmail(args: {
  email: string;
  targetAge: number;
  daysUntilUnlock: number;
}): Promise<void> {
  const content = composeStaleReminderEmail(args);
  const result = await sendEmail({
    to: content.to,
    subject: content.subject,
    text: content.text,
    html: content.html,
  });
  if (!result.ok) {
    throw new Error(result.error);
  }
}

export async function remindDraft(args: {
  email: string;
  targetAge: number;
}): Promise<void> {
  const content = composeDraftReminderEmail(args);
  const result = await sendEmail({
    to: content.to,
    subject: content.subject,
    text: content.text,
    html: content.html,
  });
  if (!result.ok) {
    throw new Error(result.error);
  }
}
