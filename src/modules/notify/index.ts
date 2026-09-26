export async function notifyUnlock(args: {
  email: string;
  letterId: string;
  targetAge: number;
}): Promise<void> {
  console.log("[notify] unlock stub", args);
}

export async function remindUnusedStamp(args: {
  email: string;
  year: number;
}): Promise<void> {
  console.log("[notify] unused-stamp reminder stub", args);
}

export async function remindStaleUnlockEmail(args: {
  email: string;
  letterId: string;
  daysBefore: number;
}): Promise<void> {
  console.log("[notify] stale-email reminder stub", args);
}
