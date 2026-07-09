-- Phase 13E: admin suspend + delivery block + commission adjustment type
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "suspendedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "suspendedById" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "suspendReason" TEXT;

ALTER TABLE "DeliveryProfile" ADD COLUMN IF NOT EXISTS "isBlocked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "DeliveryProfile" ADD COLUMN IF NOT EXISTS "blockedAt" TIMESTAMP(3);
ALTER TABLE "DeliveryProfile" ADD COLUMN IF NOT EXISTS "blockedById" TEXT;
ALTER TABLE "DeliveryProfile" ADD COLUMN IF NOT EXISTS "blockReason" TEXT;

ALTER TYPE "CommissionLedgerEventType" ADD VALUE IF NOT EXISTS 'ADMIN_ADJUSTMENT';
