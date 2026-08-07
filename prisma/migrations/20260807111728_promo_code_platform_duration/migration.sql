-- Platform admin promotions: duration (billing cycles), display name, per-user cap, creator audit.
ALTER TABLE "PromoCode" ADD COLUMN IF NOT EXISTS "name" TEXT;
ALTER TABLE "PromoCode" ADD COLUMN IF NOT EXISTS "discountDurationCycles" INTEGER;
ALTER TABLE "PromoCode" ADD COLUMN IF NOT EXISTS "maxRedemptionsPerUser" INTEGER;
ALTER TABLE "PromoCode" ADD COLUMN IF NOT EXISTS "createdByAdminId" TEXT;

CREATE INDEX IF NOT EXISTS "PromoCode_createdByAdminId_idx" ON "PromoCode"("createdByAdminId");
