-- Marketplace Taxonomy V1 Slice 4: accepted alternative value tags
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "acceptedSpecializations" TEXT[] DEFAULT ARRAY[]::TEXT[];

CREATE INDEX IF NOT EXISTS "Product_acceptedSpecializations_idx" ON "Product" USING GIN ("acceptedSpecializations");
