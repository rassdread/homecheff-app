-- Additive: optional immutable seller-fee snapshot copy on marketplace HC_ONLY orders.
-- No backfill. Existing EUR/historical rows remain NULL (LEGACY_NO_SNAPSHOT).

ALTER TABLE "Order" ADD COLUMN "hcFeeSnapshot" JSONB;

ALTER TABLE "MarketplaceHcSettlementExposure" ADD COLUMN "feeSourceType" TEXT;
ALTER TABLE "MarketplaceHcSettlementExposure" ADD COLUMN "programId" TEXT;
ALTER TABLE "MarketplaceHcSettlementExposure" ADD COLUMN "calculationVersion" TEXT;
ALTER TABLE "MarketplaceHcSettlementExposure" ADD COLUMN "effectiveSellerFeeBps" INTEGER;

