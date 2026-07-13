-- Marketplace Entry V3: multi-select specializations for search/matching
ALTER TABLE "Product" ADD COLUMN "specializations" TEXT[] DEFAULT ARRAY[]::TEXT[];

CREATE INDEX "Product_specializations_idx" ON "Product" USING GIN ("specializations");
