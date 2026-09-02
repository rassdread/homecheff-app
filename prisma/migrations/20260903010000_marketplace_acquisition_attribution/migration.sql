-- Marketplace first-party acquisition attribution (UTM + activation). Additive; no fee/checkout changes.

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "acquisitionFirstTouch" JSONB;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "acquisitionActivatedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "acquisitionActivationKind" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sellerActivatedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "User_acquisitionActivatedAt_idx" ON "User"("acquisitionActivatedAt");
CREATE INDEX IF NOT EXISTS "User_sellerActivatedAt_idx" ON "User"("sellerActivatedAt");
