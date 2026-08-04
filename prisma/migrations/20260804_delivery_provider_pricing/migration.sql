-- Additive Phase 2: provider-owned pricing on DeliveryProfile.
-- Non-destructive. Existing rows get pricingEnabled=false.

ALTER TABLE "DeliveryProfile" ADD COLUMN IF NOT EXISTS "pricingEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "DeliveryProfile" ADD COLUMN IF NOT EXISTS "baseFeeCents" INTEGER;
ALTER TABLE "DeliveryProfile" ADD COLUMN IF NOT EXISTS "pricePerKmCents" INTEGER;
ALTER TABLE "DeliveryProfile" ADD COLUMN IF NOT EXISTS "minimumFeeCents" INTEGER;
ALTER TABLE "DeliveryProfile" ADD COLUMN IF NOT EXISTS "freeDeliveryRadiusKm" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "DeliveryProfile" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'EUR';
ALTER TABLE "DeliveryProfile" ADD COLUMN IF NOT EXISTS "nationalCoverage" BOOLEAN NOT NULL DEFAULT false;
