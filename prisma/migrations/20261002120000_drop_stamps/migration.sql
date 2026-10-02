-- Fail if any user has more than one letter row for the same target age (should be impossible with unique index).
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT "userId", "targetAge", COUNT(*) AS c
    FROM "Letter"
    GROUP BY "userId", "targetAge"
    HAVING COUNT(*) > 1
  ) dup;
  IF duplicate_count > 0 THEN
    RAISE EXCEPTION 'Cannot migrate: % duplicate (userId, targetAge) letter groups', duplicate_count;
  END IF;
END $$;

-- DropForeignKey
ALTER TABLE "Letter" DROP CONSTRAINT "Letter_stampId_fkey";

-- DropIndex
DROP INDEX "Letter_stampId_key";

-- AlterTable
ALTER TABLE "Letter" DROP COLUMN "stampId";

-- DropForeignKey
ALTER TABLE "Stamp" DROP CONSTRAINT "Stamp_userId_fkey";

-- DropTable
DROP TABLE "Stamp";
