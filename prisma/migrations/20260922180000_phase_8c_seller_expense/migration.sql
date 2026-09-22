-- PHASE 8C — seller expense administration.
--
-- Additive only: one new table and four new enums. No existing table, column,
-- constraint or row is touched, so existing financial data cannot be affected.
-- Guarded so a partial or repeated run is safe.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SellerExpenseCategory') THEN
    CREATE TYPE "public"."SellerExpenseCategory" AS ENUM ('MATERIALS', 'PACKAGING', 'PLATFORM', 'DELIVERY', 'EQUIPMENT', 'MARKETING', 'OTHER');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SellerExpenseFiscalTreatment') THEN
    CREATE TYPE "public"."SellerExpenseFiscalTreatment" AS ENUM ('UNKNOWN', 'ORDINARY_EXPENSE', 'INVESTMENT', 'NON_DEDUCTIBLE', 'LIMITED_DEDUCTIBLE');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SellerExpenseSource') THEN
    CREATE TYPE "public"."SellerExpenseSource" AS ENUM ('USER_PROVIDED', 'RECEIPT_CONFIRMED', 'AI_SUGGESTED', 'IMPORTED', 'PLATFORM_DERIVED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SellerExpenseConfirmation') THEN
    CREATE TYPE "public"."SellerExpenseConfirmation" AS ENUM ('DRAFT', 'CONFIRMED', 'NEEDS_REVIEW');
  END IF;
END
$$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."SellerExpense" (
    "id" TEXT NOT NULL,
    "sellerUserId" TEXT NOT NULL,
    "expenseDate" TIMESTAMP(3) NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "category" "public"."SellerExpenseCategory" NOT NULL,
    "businessUseBp" INTEGER,
    "fiscalTreatment" "public"."SellerExpenseFiscalTreatment" NOT NULL DEFAULT 'UNKNOWN',
    "source" "public"."SellerExpenseSource" NOT NULL DEFAULT 'USER_PROVIDED',
    "confirmationStatus" "public"."SellerExpenseConfirmation" NOT NULL DEFAULT 'DRAFT',
    "taxYear" INTEGER NOT NULL,
    "merchantName" TEXT,
    "description" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "SellerExpense_pkey" PRIMARY KEY ("id")
);

-- A seller's own rows, scoped to one tax year, excluding deleted ones.
CREATE INDEX IF NOT EXISTS "SellerExpense_sellerUserId_taxYear_deletedAt_idx" ON "public"."SellerExpense"("sellerUserId", "taxYear", "deletedAt");
CREATE INDEX IF NOT EXISTS "SellerExpense_sellerUserId_expenseDate_idx" ON "public"."SellerExpense"("sellerUserId", "expenseDate");
CREATE INDEX IF NOT EXISTS "SellerExpense_deletedAt_idx" ON "public"."SellerExpense"("deletedAt");

-- Account erasure removes the seller's own financial administration with them.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'SellerExpense_sellerUserId_fkey'
  ) THEN
    ALTER TABLE "public"."SellerExpense"
      ADD CONSTRAINT "SellerExpense_sellerUserId_fkey"
      FOREIGN KEY ("sellerUserId") REFERENCES "public"."User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;
