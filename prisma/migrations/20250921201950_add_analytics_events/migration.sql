/*
  Warnings:

  - Added the required column `updatedAt` to the `SellerProfile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."DeliveryProfile" ADD COLUMN     "currentAddress" TEXT,
ADD COLUMN     "currentLat" DOUBLE PRECISION,
ADD COLUMN     "currentLng" DOUBLE PRECISION,
ADD COLUMN     "deliveryMode" TEXT NOT NULL DEFAULT 'FIXED',
ADD COLUMN     "deliveryRegions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "lastLocationUpdate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."SellerProfile" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deliveryMode" TEXT NOT NULL DEFAULT 'FIXED',
ADD COLUMN     "deliveryRadius" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
ADD COLUMN     "deliveryRegions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "public"."AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "userId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnalyticsEvent_eventType_entityType_idx" ON "public"."AnalyticsEvent"("eventType", "entityType");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_entityId_idx" ON "public"."AnalyticsEvent"("entityId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_userId_idx" ON "public"."AnalyticsEvent"("userId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_createdAt_idx" ON "public"."AnalyticsEvent"("createdAt");
