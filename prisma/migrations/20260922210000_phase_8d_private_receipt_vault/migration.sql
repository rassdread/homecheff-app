-- PHASE 8D — private financial evidence vault.
--
-- Purely additive: one table, two enums, four indexes, two foreign keys.
-- No existing column, constraint or row is touched, so nothing in the 8B/8B.2/8C
-- financial surface can change as a result of applying this.
--
-- Guarded with IF NOT EXISTS throughout so a partial apply can be re-run.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SellerEvidenceKind') THEN
    CREATE TYPE "public"."SellerEvidenceKind" AS ENUM ('RECEIPT', 'INVOICE', 'OTHER_SUPPORTING_DOCUMENT');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SellerEvidenceStatus') THEN
    CREATE TYPE "public"."SellerEvidenceStatus" AS ENUM ('UPLOADING', 'STORED', 'PENDING_PURGE', 'PURGED', 'MISSING');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "public"."SellerFinancialEvidence" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "kind" "public"."SellerEvidenceKind" NOT NULL DEFAULT 'RECEIPT',
    "status" "public"."SellerEvidenceStatus" NOT NULL DEFAULT 'UPLOADING',
    "objectKey" TEXT NOT NULL,
    "storeNamespace" TEXT NOT NULL DEFAULT 'receipt-vault',
    "originalFilename" TEXT,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "metadataStripped" BOOLEAN NOT NULL DEFAULT false,
    "linkedExpenseId" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "purgeAfter" TIMESTAMP(3),
    "purgedAt" TIMESTAMP(3),
    "purgeAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastPurgeError" TEXT,

    CONSTRAINT "SellerFinancialEvidence_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SellerFinancialEvidence_objectKey_key" ON "public"."SellerFinancialEvidence"("objectKey");
CREATE INDEX IF NOT EXISTS "SellerFinancialEvidence_ownerUserId_status_idx" ON "public"."SellerFinancialEvidence"("ownerUserId", "status");
CREATE INDEX IF NOT EXISTS "SellerFinancialEvidence_linkedExpenseId_status_idx" ON "public"."SellerFinancialEvidence"("linkedExpenseId", "status");
CREATE INDEX IF NOT EXISTS "SellerFinancialEvidence_ownerUserId_sha256_idx" ON "public"."SellerFinancialEvidence"("ownerUserId", "sha256");
CREATE INDEX IF NOT EXISTS "SellerFinancialEvidence_status_purgeAfter_idx" ON "public"."SellerFinancialEvidence"("status", "purgeAfter");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'SellerFinancialEvidence_ownerUserId_fkey'
  ) THEN
    ALTER TABLE "public"."SellerFinancialEvidence"
      ADD CONSTRAINT "SellerFinancialEvidence_ownerUserId_fkey"
      FOREIGN KEY ("ownerUserId") REFERENCES "public"."User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'SellerFinancialEvidence_linkedExpenseId_fkey'
  ) THEN
    -- SET NULL, not CASCADE: unlinking evidence from an expense must never be
    -- able to take the expense's own row with it.
    ALTER TABLE "public"."SellerFinancialEvidence"
      ADD CONSTRAINT "SellerFinancialEvidence_linkedExpenseId_fkey"
      FOREIGN KEY ("linkedExpenseId") REFERENCES "public"."SellerExpense"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END
$$;
