-- LEGAL-1: seller commerce self-declaration + review state (additive only).
-- NO backfill of PRIVATE_OCCASIONAL / SELF_DECLARED_PROFESSIONAL.
-- Existing rows get UNDECLARED / NONE via column defaults only.
-- Rollback: DROP COLUMN commerce* from "SellerProfile" (after code rollback).

ALTER TABLE "SellerProfile" ADD COLUMN IF NOT EXISTS "commerceDeclaration" TEXT NOT NULL DEFAULT 'UNDECLARED';
ALTER TABLE "SellerProfile" ADD COLUMN IF NOT EXISTS "commerceDeclaredAt" TIMESTAMP(3);
ALTER TABLE "SellerProfile" ADD COLUMN IF NOT EXISTS "commerceReviewState" TEXT NOT NULL DEFAULT 'NONE';
ALTER TABLE "SellerProfile" ADD COLUMN IF NOT EXISTS "commerceReviewRequiredAt" TIMESTAMP(3);
ALTER TABLE "SellerProfile" ADD COLUMN IF NOT EXISTS "commerceReviewReasons" TEXT[] DEFAULT ARRAY[]::TEXT[];

CREATE INDEX IF NOT EXISTS "SellerProfile_commerceDeclaration_idx" ON "SellerProfile"("commerceDeclaration");
CREATE INDEX IF NOT EXISTS "SellerProfile_commerceReviewState_idx" ON "SellerProfile"("commerceReviewState");
