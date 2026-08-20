-- HC seller payout engine — additive dormant schema. No payout execution implied.

-- Extend settlement status enum (PostgreSQL 9.1+ additive)
ALTER TYPE "MarketplaceHcSettlementStatus" ADD VALUE IF NOT EXISTS 'PAYOUT_PENDING';
ALTER TYPE "MarketplaceHcSettlementStatus" ADD VALUE IF NOT EXISTS 'PAID';
ALTER TYPE "MarketplaceHcSettlementStatus" ADD VALUE IF NOT EXISTS 'PAYOUT_FAILED_RETRYABLE';
ALTER TYPE "MarketplaceHcSettlementStatus" ADD VALUE IF NOT EXISTS 'PAYOUT_BLOCKED';

-- CreateEnum
CREATE TYPE "MarketplaceHcSellerPayoutAttemptStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED');
CREATE TYPE "MarketplaceHcSellerPayoutProvider" AS ENUM ('STRIPE_CONNECT', 'MANUAL');

-- AlterTable MarketplaceHcSettlementExposure
ALTER TABLE "MarketplaceHcSettlementExposure" ADD COLUMN IF NOT EXISTS "payableAmountCents" INTEGER;
ALTER TABLE "MarketplaceHcSettlementExposure" ADD COLUMN IF NOT EXISTS "payoutProvider" "MarketplaceHcSellerPayoutProvider";
ALTER TABLE "MarketplaceHcSettlementExposure" ADD COLUMN IF NOT EXISTS "payoutReference" TEXT;
ALTER TABLE "MarketplaceHcSettlementExposure" ADD COLUMN IF NOT EXISTS "payoutIdempotencyKey" TEXT;
ALTER TABLE "MarketplaceHcSettlementExposure" ADD COLUMN IF NOT EXISTS "payoutAttemptedAt" TIMESTAMP(3);
ALTER TABLE "MarketplaceHcSettlementExposure" ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP(3);
ALTER TABLE "MarketplaceHcSettlementExposure" ADD COLUMN IF NOT EXISTS "lastPayoutErrorCode" TEXT;
ALTER TABLE "MarketplaceHcSettlementExposure" ADD COLUMN IF NOT EXISTS "payoutCalculationVersion" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "MarketplaceHcSettlementExposure_payoutIdempotencyKey_key"
  ON "MarketplaceHcSettlementExposure"("payoutIdempotencyKey");

-- CreateTable payout attempts (immutable audit)
CREATE TABLE IF NOT EXISTS "MarketplaceHcSellerPayoutAttempt" (
    "id" TEXT NOT NULL,
    "exposureId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "status" "MarketplaceHcSellerPayoutAttemptStatus" NOT NULL DEFAULT 'PENDING',
    "idempotencyKey" TEXT NOT NULL,
    "provider" "MarketplaceHcSellerPayoutProvider" NOT NULL DEFAULT 'STRIPE_CONNECT',
    "providerTransferRef" TEXT,
    "destinationAccountId" TEXT,
    "errorCode" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "MarketplaceHcSellerPayoutAttempt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MarketplaceHcSellerPayoutAttempt_idempotencyKey_key"
  ON "MarketplaceHcSellerPayoutAttempt"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "MarketplaceHcSellerPayoutAttempt_exposureId_idx"
  ON "MarketplaceHcSellerPayoutAttempt"("exposureId");
CREATE UNIQUE INDEX IF NOT EXISTS "MarketplaceHcSellerPayoutAttempt_exposureId_attemptNumber_key"
  ON "MarketplaceHcSellerPayoutAttempt"("exposureId", "attemptNumber");

DO $$ BEGIN
  ALTER TABLE "MarketplaceHcSellerPayoutAttempt"
    ADD CONSTRAINT "MarketplaceHcSellerPayoutAttempt_exposureId_fkey"
    FOREIGN KEY ("exposureId") REFERENCES "MarketplaceHcSettlementExposure"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
