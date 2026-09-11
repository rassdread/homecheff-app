-- AlterTable
ALTER TABLE "CommunityOrder" ADD COLUMN IF NOT EXISTS "pickupAddress" TEXT,
ADD COLUMN IF NOT EXISTS "deliveryAddress" TEXT,
ADD COLUMN IF NOT EXISTS "confirmedScheduleDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "confirmedScheduleTimeWindow" TEXT,
ADD COLUMN IF NOT EXISTS "locationCompletedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "locationCompletedById" TEXT;
