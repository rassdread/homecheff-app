-- TRUST-1.1: listing-level seller contribution / provenance (additive, no backfill).
-- Empty sellerContributionTypes = NOT DECLARED (legacy remains valid / discoverable).

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "sellerContributionTypes" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "sellerContributionNote" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "sellerContributionUpdatedAt" TIMESTAMP(3);
