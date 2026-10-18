-- Additive checkout reservation safety.
-- Existing rows stay valid: every new column is nullable or has a default.
-- Does not change Product.stock and does not rewrite existing reservations.

ALTER TABLE "StockReservation" ADD COLUMN IF NOT EXISTS "buyerId" TEXT;
ALTER TABLE "StockReservation" ADD COLUMN IF NOT EXISTS "bookingRequestId" TEXT;
ALTER TABLE "StockReservation" ADD COLUMN IF NOT EXISTS "phase" TEXT;
ALTER TABLE "StockReservation" ADD COLUMN IF NOT EXISTS "holdUntil" TIMESTAMP(3);
ALTER TABLE "StockReservation" ADD COLUMN IF NOT EXISTS "paymentDeadline" TIMESTAMP(3);
ALTER TABLE "StockReservation" ADD COLUMN IF NOT EXISTS "purchaseKey" TEXT;
ALTER TABLE "StockReservation" ADD COLUMN IF NOT EXISTS "checkoutSessionId" TEXT;

CREATE INDEX IF NOT EXISTS "StockReservation_buyerId_status_idx" ON "StockReservation"("buyerId", "status");
CREATE INDEX IF NOT EXISTS "StockReservation_bookingRequestId_idx" ON "StockReservation"("bookingRequestId");
CREATE INDEX IF NOT EXISTS "StockReservation_purchaseKey_idx" ON "StockReservation"("purchaseKey");
CREATE INDEX IF NOT EXISTS "StockReservation_checkoutSessionId_idx" ON "StockReservation"("checkoutSessionId");
CREATE INDEX IF NOT EXISTS "StockReservation_holdUntil_idx" ON "StockReservation"("holdUntil");

ALTER TABLE "DeliveryBookingRequest" ADD COLUMN IF NOT EXISTS "cancelledAt" TIMESTAMP(3);
ALTER TABLE "DeliveryBookingRequest" ADD COLUMN IF NOT EXISTS "supersededByRequestId" TEXT;

CREATE TABLE IF NOT EXISTS "CheckoutPaymentIncident" (
    "id" TEXT NOT NULL,
    "stripeSessionId" TEXT NOT NULL,
    "paymentIntentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'REFUND_REQUIRED',
    "reason" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "buyerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CheckoutPaymentIncident_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CheckoutPaymentIncident_stripeSessionId_key" ON "CheckoutPaymentIncident"("stripeSessionId");
CREATE INDEX IF NOT EXISTS "CheckoutPaymentIncident_status_idx" ON "CheckoutPaymentIncident"("status");
