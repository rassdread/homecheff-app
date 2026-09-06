-- Partner API rebuild: grams, presets, cost reconciliation, tracking URL, sync cursor fields

ALTER TABLE "Product"
  ADD COLUMN IF NOT EXISTS "weightGrams" INTEGER,
  ADD COLUMN IF NOT EXISTS "parcelPreset" TEXT;

-- Backfill grams from legacy kg where present
UPDATE "Product"
SET "weightGrams" = ROUND("weightKg" * 1000)::int
WHERE "weightGrams" IS NULL AND "weightKg" IS NOT NULL AND "weightKg" > 0;

ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "shippingQuotedCents" INTEGER,
  ADD COLUMN IF NOT EXISTS "shippingBuyerChargedCents" INTEGER,
  ADD COLUMN IF NOT EXISTS "shippingActualCostCents" INTEGER,
  ADD COLUMN IF NOT EXISTS "shippingCurrency" TEXT,
  ADD COLUMN IF NOT EXISTS "shippingMethodId" TEXT,
  ADD COLUMN IF NOT EXISTS "shippingProductId" TEXT,
  ADD COLUMN IF NOT EXISTS "shippingProviderOrderId" TEXT,
  ADD COLUMN IF NOT EXISTS "shippingTrackingUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "shippingProviderStatus" TEXT,
  ADD COLUMN IF NOT EXISTS "shippingProviderStatusRaw" TEXT,
  ADD COLUMN IF NOT EXISTS "shippingLastSyncedAt" TIMESTAMP(3);

-- Align charged/quoted from legacy shippingCostCents
UPDATE "Order"
SET "shippingBuyerChargedCents" = "shippingCostCents",
    "shippingQuotedCents" = COALESCE("shippingQuotedCents", "shippingCostCents")
WHERE "shippingCostCents" IS NOT NULL AND "shippingBuyerChargedCents" IS NULL;

UPDATE "Order"
SET "shippingActualCostCents" = "shippingLabelCostCents"
WHERE "shippingLabelCostCents" IS NOT NULL AND "shippingActualCostCents" IS NULL;

-- Sync cursor singleton (key/value via existing pattern: use ShippingSyncState table)
CREATE TABLE IF NOT EXISTS "ShippingSyncState" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "lastSuccessfulSyncAt" TIMESTAMP(3),
  "updatedSinceCursor" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ShippingSyncState_pkey" PRIMARY KEY ("id")
);

INSERT INTO "ShippingSyncState" ("id")
VALUES ('default')
ON CONFLICT ("id") DO NOTHING;
