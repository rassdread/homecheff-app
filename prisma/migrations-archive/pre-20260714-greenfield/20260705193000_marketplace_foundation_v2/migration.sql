-- Marketplace Foundation V2 (additive, backwards compatible)

CREATE TYPE "ListingIntent" AS ENUM ('OFFER', 'REQUEST');
CREATE TYPE "MarketplaceCategory" AS ENUM ('CREATE', 'GROW', 'DESIGN', 'ARTISTIC_SERVICE', 'PRACTICAL_SERVICE', 'KNOWLEDGE');
CREATE TYPE "PriceModel" AS ENUM ('FIXED', 'ON_REQUEST', 'FROM_PRICE', 'HOURLY', 'DAILY', 'VOLUNTARY');
CREATE TYPE "BarterOpenness" AS ENUM ('MONEY', 'MONEY_AND_BARTER', 'BARTER_ONLY');

ALTER TABLE "Product" ADD COLUMN "listingIntent" "ListingIntent" NOT NULL DEFAULT 'OFFER';
ALTER TABLE "Product" ADD COLUMN "marketplaceCategory" "MarketplaceCategory";
ALTER TABLE "Product" ADD COLUMN "priceModel" "PriceModel" NOT NULL DEFAULT 'FIXED';
ALTER TABLE "Product" ADD COLUMN "acceptHomeCheffPayment" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Product" ADD COLUMN "acceptDirectContact" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN "fulfillmentOptions" JSONB;
ALTER TABLE "Product" ADD COLUMN "barterOpenness" "BarterOpenness";
ALTER TABLE "Product" ADD COLUMN "placeName" TEXT;
ALTER TABLE "Product" ADD COLUMN "useProfileLocation" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX "Product_listingIntent_idx" ON "Product"("listingIntent");
CREATE INDEX "Product_marketplaceCategory_idx" ON "Product"("marketplaceCategory");
CREATE INDEX "Product_priceModel_idx" ON "Product"("priceModel");

-- Backfill marketplaceCategory from legacy Product.category
UPDATE "Product" SET "marketplaceCategory" = 'CREATE' WHERE "category" = 'CHEFF' AND "marketplaceCategory" IS NULL;
UPDATE "Product" SET "marketplaceCategory" = 'GROW' WHERE "category" = 'GROWN' AND "marketplaceCategory" IS NULL;
UPDATE "Product" SET "marketplaceCategory" = 'DESIGN' WHERE "category" = 'DESIGNER' AND "marketplaceCategory" IS NULL;

-- Backfill payment flags from orderMethod
UPDATE "Product" SET "acceptHomeCheffPayment" = true, "acceptDirectContact" = false WHERE "orderMethod" = 'HOMECHEFF_PAYMENT';
UPDATE "Product" SET "acceptHomeCheffPayment" = false, "acceptDirectContact" = true WHERE "orderMethod" = 'CONTACT';
