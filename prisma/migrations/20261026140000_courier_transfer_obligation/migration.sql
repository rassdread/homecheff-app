-- One courier transfer obligation per delivery order and source charge.
-- Existing payout rows are not rewritten.
CREATE TABLE "CourierTransferObligation" (
    "id" TEXT NOT NULL,
    "deliveryOrderId" TEXT NOT NULL,
    "chargeId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'eur',
    "destinationConnectAccountId" TEXT NOT NULL,
    "recipientUserId" TEXT NOT NULL,
    "transferGroup" TEXT NOT NULL,
    "stripeTransferId" TEXT,
    "stripeCreateAttemptedAt" TIMESTAMP(3),
    "processingLeaseUntil" TIMESTAMP(3),
    "processingOwner" TEXT,
    "lastErrorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourierTransferObligation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CourierTransferObligation_idempotencyKey_key" ON "CourierTransferObligation"("idempotencyKey");

CREATE UNIQUE INDEX "CourierTransferObligation_deliveryOrderId_chargeId_purpose_key" ON "CourierTransferObligation"("deliveryOrderId", "chargeId", "purpose");

CREATE INDEX "CourierTransferObligation_state_processingLeaseUntil_idx" ON "CourierTransferObligation"("state", "processingLeaseUntil");
