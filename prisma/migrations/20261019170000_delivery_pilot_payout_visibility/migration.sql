-- Additive courier payout cache and visible transfer failures.
-- Existing rows stay valid. No amounts are rewritten.

ALTER TABLE "DeliveryProfile" ADD COLUMN IF NOT EXISTS "stripePayoutsEnabled" BOOLEAN;
ALTER TABLE "Payout" ADD COLUMN IF NOT EXISTS "transferFailureCode" TEXT;
ALTER TABLE "Payout" ADD COLUMN IF NOT EXISTS "transferFailureAt" TIMESTAMP(3);
