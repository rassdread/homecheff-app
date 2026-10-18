-- First valid listing fact and HC campaign code. Does not grant credits.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "firstValidListingAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "firstValidListingProductId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "hcCampaignCode" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "hcCampaignGrantPending" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "hcCampaignGrantAttemptAt" TIMESTAMP(3);
