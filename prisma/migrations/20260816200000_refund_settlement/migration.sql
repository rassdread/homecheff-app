-- Durable refund + Connect transfer-reversal settlement ledger
CREATE TABLE IF NOT EXISTS "RefundSettlement" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "buyerRefundCents" INTEGER NOT NULL,
    "planJson" TEXT NOT NULL,
    "resultJson" TEXT,
    "stripeRefundId" TEXT,
    "createdByAdminId" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "executedAt" TIMESTAMP(3),

    CONSTRAINT "RefundSettlement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "RefundSettlement_idempotencyKey_key" ON "RefundSettlement"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "RefundSettlement_orderId_idx" ON "RefundSettlement"("orderId");
CREATE INDEX IF NOT EXISTS "RefundSettlement_status_idx" ON "RefundSettlement"("status");
