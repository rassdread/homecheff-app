-- Baseline pack (Phase 8): allow PromoCode without affiliate (admin promos).
-- Idempotent on DB where column is already nullable.

ALTER TABLE "PromoCode" ALTER COLUMN "affiliateId" DROP NOT NULL;
