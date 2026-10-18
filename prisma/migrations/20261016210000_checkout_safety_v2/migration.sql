-- Checkout safety v2.
-- One order per Checkout Session. Incident review fields are nullable or defaulted.
-- Does not refund, transfer, or change existing orders.

CREATE UNIQUE INDEX IF NOT EXISTS "Order_stripeSessionId_key"
  ON "Order" ("stripeSessionId");

ALTER TABLE "CheckoutPaymentIncident" ADD COLUMN IF NOT EXISTS "attemptCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "CheckoutPaymentIncident" ADD COLUMN IF NOT EXISTS "lockedAt" TIMESTAMP(3);
ALTER TABLE "CheckoutPaymentIncident" ADD COLUMN IF NOT EXISTS "lockToken" TEXT;
ALTER TABLE "CheckoutPaymentIncident" ADD COLUMN IF NOT EXISTS "resolvedAt" TIMESTAMP(3);
ALTER TABLE "CheckoutPaymentIncident" ADD COLUMN IF NOT EXISTS "resolution" TEXT;
ALTER TABLE "CheckoutPaymentIncident" ADD COLUMN IF NOT EXISTS "refundId" TEXT;
ALTER TABLE "CheckoutPaymentIncident" ADD COLUMN IF NOT EXISTS "orderId" TEXT;
ALTER TABLE "CheckoutPaymentIncident" ADD COLUMN IF NOT EXISTS "lastError" TEXT;
