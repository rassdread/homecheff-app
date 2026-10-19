-- Additive delivery payout eligibility, immutable agreement versions, and refund decisions.
-- Existing rows stay valid. No amounts are rewritten.

ALTER TABLE "DeliveryProfile" ADD COLUMN IF NOT EXISTS "stripeTransfersStatus" TEXT;
ALTER TABLE "DeliveryProfile" ADD COLUMN IF NOT EXISTS "stripeTransfersCheckedAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "DeliveryAgreementAcceptance" (
    "id" TEXT NOT NULL,
    "deliveryProfileId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DeliveryAgreementAcceptance_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DeliveryAgreementAcceptance_deliveryProfileId_version_language_key"
  ON "DeliveryAgreementAcceptance"("deliveryProfileId", "version", "language");
CREATE INDEX IF NOT EXISTS "DeliveryAgreementAcceptance_userId_acceptedAt_idx"
  ON "DeliveryAgreementAcceptance"("userId", "acceptedAt");

DO $$ BEGIN
  ALTER TABLE "DeliveryAgreementAcceptance"
    ADD CONSTRAINT "DeliveryAgreementAcceptance_deliveryProfileId_fkey"
    FOREIGN KEY ("deliveryProfileId") REFERENCES "DeliveryProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "DeliveryRefundDecision" (
    "id" TEXT NOT NULL,
    "deliveryOrderId" TEXT NOT NULL,
    "orderId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "stripePaymentRef" TEXT,
    "stripeRefundId" TEXT,
    "stripeReversalId" TEXT,
    "stripeStatus" TEXT,
    "outstandingCents" INTEGER NOT NULL DEFAULT 0,
    "adminUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executedAt" TIMESTAMP(3),
    CONSTRAINT "DeliveryRefundDecision_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DeliveryRefundDecision_idempotencyKey_key"
  ON "DeliveryRefundDecision"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "DeliveryRefundDecision_deliveryOrderId_createdAt_idx"
  ON "DeliveryRefundDecision"("deliveryOrderId", "createdAt");
