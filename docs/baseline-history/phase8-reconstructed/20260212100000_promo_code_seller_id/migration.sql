-- Baseline pack (Phase 8): seller-owned promo codes.
-- Idempotent reconstruction from live DB metadata.

ALTER TABLE "PromoCode" ADD COLUMN IF NOT EXISTS "sellerId" TEXT;

CREATE INDEX IF NOT EXISTS "PromoCode_sellerId_idx" ON "PromoCode"("sellerId");

DO $$ BEGIN
  ALTER TABLE "PromoCode" ADD CONSTRAINT "PromoCode_sellerId_fkey"
    FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
