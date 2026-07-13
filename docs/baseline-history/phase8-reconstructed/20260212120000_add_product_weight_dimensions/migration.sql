-- Baseline pack (Phase 8): product parcel dimensions (cm / kg).
-- Idempotent; safe on DB where columns already exist.

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "lengthCm" DOUBLE PRECISION;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "widthCm" DOUBLE PRECISION;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "heightCm" DOUBLE PRECISION;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "weightKg" DOUBLE PRECISION;
