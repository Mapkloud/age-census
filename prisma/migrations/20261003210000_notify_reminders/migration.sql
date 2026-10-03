-- AlterTable
ALTER TABLE "Letter" ADD COLUMN "staleEmailSentAt" TIMESTAMP(3);
ALTER TABLE "Letter" ADD COLUMN "draftReminderSentAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Letter_status_staleEmailSentAt_idx" ON "Letter"("status", "staleEmailSentAt");

-- CreateIndex
CREATE INDEX "Letter_status_draftReminderSentAt_idx" ON "Letter"("status", "draftReminderSentAt");
