-- Durable Stripe dispute / chargeback financial recovery ledger
CREATE TABLE IF NOT EXISTS "DisputeSettlement" (
    "id" TEXT NOT NULL,
    "stripeDisputeId" TEXT NOT NULL,
    "orderId" TEXT,
    "chargeId" TEXT,
    "paymentIntentId" TEXT,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'eur',
    "reason" TEXT,
    "stripeStatus" TEXT NOT NULL,
    "financialStatus" TEXT NOT NULL,
    "evidenceDueBy" TIMESTAMP(3),
    "recoveredSellerCents" INTEGER NOT NULL DEFAULT 0,
    "recoveredAffiliateCents" INTEGER NOT NULL DEFAULT 0,
    "recoveredCourierCents" INTEGER NOT NULL DEFAULT 0,
    "outstandingSellerCents" INTEGER NOT NULL DEFAULT 0,
    "planJson" TEXT NOT NULL,
    "resultJson" TEXT,
    "lastError" TEXT,
    "lastStripeEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DisputeSettlement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DisputeSettlement_stripeDisputeId_key" ON "DisputeSettlement"("stripeDisputeId");
CREATE INDEX IF NOT EXISTS "DisputeSettlement_orderId_idx" ON "DisputeSettlement"("orderId");
CREATE INDEX IF NOT EXISTS "DisputeSettlement_financialStatus_idx" ON "DisputeSettlement"("financialStatus");
CREATE INDEX IF NOT EXISTS "DisputeSettlement_chargeId_idx" ON "DisputeSettlement"("chargeId");
