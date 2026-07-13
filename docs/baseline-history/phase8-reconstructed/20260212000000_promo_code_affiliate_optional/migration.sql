-- Baseline pack (Phase 8): second step making affiliate optional on PromoCode.
-- Overlaps with promo_code_admin_optional_affiliate; idempotent no-op when already nullable.

ALTER TABLE "PromoCode" ALTER COLUMN "affiliateId" DROP NOT NULL;
