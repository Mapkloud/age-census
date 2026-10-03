-- AlterTable
ALTER TABLE "Letter" ADD COLUMN "unlockEmailSentAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Letter_status_unlockEmailSentAt_idx" ON "Letter"("status", "unlockEmailSentAt");
