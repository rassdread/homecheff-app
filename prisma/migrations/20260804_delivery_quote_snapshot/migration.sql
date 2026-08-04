-- Additive Phase 2.2: immutable provider quote snapshot on DeliveryOrder.
-- Non-destructive. All new columns nullable. No historical rewrite.

ALTER TABLE "DeliveryOrder" ADD COLUMN IF NOT EXISTS "quotedFeeCents" INTEGER;
ALTER TABLE "DeliveryOrder" ADD COLUMN IF NOT EXISTS "providerDisplayNameSnapshot" TEXT;
ALTER TABLE "DeliveryOrder" ADD COLUMN IF NOT EXISTS "pricingSource" TEXT;
ALTER TABLE "DeliveryOrder" ADD COLUMN IF NOT EXISTS "pricingFormulaVersion" TEXT;
ALTER TABLE "DeliveryOrder" ADD COLUMN IF NOT EXISTS "pricingCurrency" TEXT;
ALTER TABLE "DeliveryOrder" ADD COLUMN IF NOT EXISTS "routeDistanceKmSnapshot" DOUBLE PRECISION;
ALTER TABLE "DeliveryOrder" ADD COLUMN IF NOT EXISTS "baseFeeCentsSnapshot" INTEGER;
ALTER TABLE "DeliveryOrder" ADD COLUMN IF NOT EXISTS "pricePerKmCentsSnapshot" INTEGER;
ALTER TABLE "DeliveryOrder" ADD COLUMN IF NOT EXISTS "minimumFeeCentsSnapshot" INTEGER;
ALTER TABLE "DeliveryOrder" ADD COLUMN IF NOT EXISTS "freeDeliveryRadiusKmSnapshot" DOUBLE PRECISION;
ALTER TABLE "DeliveryOrder" ADD COLUMN IF NOT EXISTS "quoteLockedAt" TIMESTAMP(3);
