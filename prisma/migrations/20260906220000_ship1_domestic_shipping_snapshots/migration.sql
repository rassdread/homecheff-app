-- SHIP-1: domestic shipping foundation — address/quote snapshots + one label per order

-- Deduplicate ShippingLabel rows (keep earliest) before unique constraint
DELETE FROM "ShippingLabel" a
USING "ShippingLabel" b
WHERE a."orderId" = b."orderId"
  AND a."createdAt" > b."createdAt";

ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "shippingAddressSnapshot" JSONB,
  ADD COLUMN IF NOT EXISTS "shippingOriginSnapshot" JSONB,
  ADD COLUMN IF NOT EXISTS "shippingQuoteSnapshot" JSONB;

DROP INDEX IF EXISTS "ShippingLabel_orderId_idx";

CREATE UNIQUE INDEX IF NOT EXISTS "ShippingLabel_orderId_key" ON "ShippingLabel"("orderId");
