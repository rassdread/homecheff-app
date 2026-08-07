-- Post-promotion lifecycle: CONTINUE (default) or END after promotional period.
ALTER TABLE "PromoCode" ADD COLUMN IF NOT EXISTS "postPromotionAction" TEXT NOT NULL DEFAULT 'CONTINUE';

ALTER TABLE "PromoCodeRedemption" ADD COLUMN IF NOT EXISTS "postPromotionAction" TEXT NOT NULL DEFAULT 'CONTINUE';
