-- LEGAL-2: Product EU-14 allergen confirmation (additive only).
-- NO backfill of allergensConfirmedAt — legacy remains UNKNOWN.
-- Confirmed+empty allergens[] means "none of the 14"; unconfirmed empty ≠ allergen-free.

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "allergens" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "allergensConfirmedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Product_allergensConfirmedAt_idx" ON "Product"("allergensConfirmedAt");
