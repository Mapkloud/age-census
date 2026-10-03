-- AlterTable
ALTER TABLE "User" ADD COLUMN "sealBalance" INTEGER NOT NULL DEFAULT 1;

-- Existing accounts receive the signup grant so nobody is locked out after this ships.
UPDATE "User" SET "sealBalance" = 1;

-- CreateTable
CREATE TABLE "SealPurchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "packId" TEXT NOT NULL,
    "seals" INTEGER NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "stripeSessionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "SealPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SealPurchase_stripeSessionId_key" ON "SealPurchase"("stripeSessionId");

-- CreateIndex
CREATE INDEX "SealPurchase_userId_idx" ON "SealPurchase"("userId");

-- AddForeignKey
ALTER TABLE "SealPurchase" ADD CONSTRAINT "SealPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
