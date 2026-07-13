/*
  Warnings:

  - The values [WALKING,ELECTRIC_BIKE] on the enum `TransportationMode` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."MessagePrivacy" AS ENUM ('NOBODY', 'FANS_ONLY', 'EVERYONE');

-- CreateEnum
CREATE TYPE "public"."FanRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."WorkspaceContentType" AS ENUM ('RECIPE', 'GROWING_PROCESS', 'DESIGN_ITEM');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."TransportationMode_new" AS ENUM ('BIKE', 'EBIKE', 'SCOOTER', 'CAR');
ALTER TABLE "public"."DeliveryProfile" ALTER COLUMN "transportation" TYPE "public"."TransportationMode_new"[] USING ("transportation"::text::"public"."TransportationMode_new"[]);
ALTER TYPE "public"."TransportationMode" RENAME TO "TransportationMode_old";
ALTER TYPE "public"."TransportationMode_new" RENAME TO "TransportationMode";
DROP TYPE "public"."TransportationMode_old";
COMMIT;

-- AlterEnum
ALTER TYPE "public"."UserRole" ADD VALUE 'DELIVERY';

-- AlterTable
ALTER TABLE "public"."DeliveryOrder" ADD COLUMN     "deliveryFeeCollected" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."Order" ADD COLUMN     "platformFeeCollected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stripeSessionId" TEXT;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "allowProfileViews" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "fanRequestEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "messagePrivacy" "public"."MessagePrivacy" NOT NULL DEFAULT 'EVERYONE',
ADD COLUMN     "showActivityStatus" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showFansList" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showOnlineStatus" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showProfileToEveryone" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "public"."FanRequest" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "status" "public"."FanRequestStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FanRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."HomeCheffCollection" (
    "id" TEXT NOT NULL,
    "platformFees" INTEGER NOT NULL,
    "deliveryFeeCuts" INTEGER NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "description" TEXT,
    "processedOrdersCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeCheffCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VehiclePhoto" (
    "id" TEXT NOT NULL,
    "deliveryProfileId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehiclePhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DeliveryReview" (
    "id" TEXT NOT NULL,
    "deliveryProfileId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "orderId" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkplacePhoto" (
    "id" TEXT NOT NULL,
    "sellerProfileId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkplacePhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkspaceContent" (
    "id" TEXT NOT NULL,
    "sellerProfileId" TEXT NOT NULL,
    "type" "public"."WorkspaceContentType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkspaceContentPhoto" (
    "id" TEXT NOT NULL,
    "workspaceContentId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceContentPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkspaceContentProp" (
    "id" TEXT NOT NULL,
    "workspaceContentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceContentProp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkspaceContentComment" (
    "id" TEXT NOT NULL,
    "workspaceContentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceContentComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Recipe" (
    "id" TEXT NOT NULL,
    "workspaceContentId" TEXT NOT NULL,
    "servings" INTEGER,
    "prepTime" INTEGER,
    "cookTime" INTEGER,
    "difficulty" TEXT,
    "ingredients" JSONB NOT NULL,
    "instructions" JSONB NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "source" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GrowingProcess" (
    "id" TEXT NOT NULL,
    "workspaceContentId" TEXT NOT NULL,
    "plantName" TEXT NOT NULL,
    "plantType" TEXT,
    "variety" TEXT,
    "startDate" TIMESTAMP(3),
    "expectedHarvest" TIMESTAMP(3),
    "growingMethod" TEXT,
    "soilType" TEXT,
    "wateringSchedule" TEXT,
    "currentStage" TEXT,
    "weeklyUpdates" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GrowingProcess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DesignItem" (
    "id" TEXT NOT NULL,
    "workspaceContentId" TEXT NOT NULL,
    "category" TEXT,
    "materials" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "techniques" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "dimensions" TEXT,
    "inspiration" TEXT,
    "process" JSONB NOT NULL,
    "challenges" TEXT,
    "solutions" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isForSale" BOOLEAN NOT NULL DEFAULT false,
    "priceCents" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DesignItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FanRequest_targetId_idx" ON "public"."FanRequest"("targetId");

-- CreateIndex
CREATE INDEX "FanRequest_status_idx" ON "public"."FanRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "FanRequest_requesterId_targetId_key" ON "public"."FanRequest"("requesterId", "targetId");

-- CreateIndex
CREATE INDEX "VehiclePhoto_deliveryProfileId_idx" ON "public"."VehiclePhoto"("deliveryProfileId");

-- CreateIndex
CREATE INDEX "DeliveryReview_deliveryProfileId_idx" ON "public"."DeliveryReview"("deliveryProfileId");

-- CreateIndex
CREATE INDEX "DeliveryReview_reviewerId_idx" ON "public"."DeliveryReview"("reviewerId");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryReview_deliveryProfileId_reviewerId_orderId_key" ON "public"."DeliveryReview"("deliveryProfileId", "reviewerId", "orderId");

-- CreateIndex
CREATE INDEX "WorkplacePhoto_sellerProfileId_idx" ON "public"."WorkplacePhoto"("sellerProfileId");

-- CreateIndex
CREATE INDEX "WorkplacePhoto_role_idx" ON "public"."WorkplacePhoto"("role");

-- CreateIndex
CREATE INDEX "WorkspaceContent_sellerProfileId_idx" ON "public"."WorkspaceContent"("sellerProfileId");

-- CreateIndex
CREATE INDEX "WorkspaceContent_type_idx" ON "public"."WorkspaceContent"("type");

-- CreateIndex
CREATE INDEX "WorkspaceContent_isPublic_idx" ON "public"."WorkspaceContent"("isPublic");

-- CreateIndex
CREATE INDEX "WorkspaceContentPhoto_workspaceContentId_idx" ON "public"."WorkspaceContentPhoto"("workspaceContentId");

-- CreateIndex
CREATE INDEX "WorkspaceContentProp_workspaceContentId_idx" ON "public"."WorkspaceContentProp"("workspaceContentId");

-- CreateIndex
CREATE INDEX "WorkspaceContentProp_userId_idx" ON "public"."WorkspaceContentProp"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceContentProp_workspaceContentId_userId_key" ON "public"."WorkspaceContentProp"("workspaceContentId", "userId");

-- CreateIndex
CREATE INDEX "WorkspaceContentComment_workspaceContentId_idx" ON "public"."WorkspaceContentComment"("workspaceContentId");

-- CreateIndex
CREATE INDEX "WorkspaceContentComment_userId_idx" ON "public"."WorkspaceContentComment"("userId");

-- CreateIndex
CREATE INDEX "WorkspaceContentComment_parentId_idx" ON "public"."WorkspaceContentComment"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "Recipe_workspaceContentId_key" ON "public"."Recipe"("workspaceContentId");

-- CreateIndex
CREATE UNIQUE INDEX "GrowingProcess_workspaceContentId_key" ON "public"."GrowingProcess"("workspaceContentId");

-- CreateIndex
CREATE UNIQUE INDEX "DesignItem_workspaceContentId_key" ON "public"."DesignItem"("workspaceContentId");

-- AddForeignKey
ALTER TABLE "public"."FanRequest" ADD CONSTRAINT "FanRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FanRequest" ADD CONSTRAINT "FanRequest_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VehiclePhoto" ADD CONSTRAINT "VehiclePhoto_deliveryProfileId_fkey" FOREIGN KEY ("deliveryProfileId") REFERENCES "public"."DeliveryProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DeliveryReview" ADD CONSTRAINT "DeliveryReview_deliveryProfileId_fkey" FOREIGN KEY ("deliveryProfileId") REFERENCES "public"."DeliveryProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DeliveryReview" ADD CONSTRAINT "DeliveryReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DeliveryReview" ADD CONSTRAINT "DeliveryReview_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkplacePhoto" ADD CONSTRAINT "WorkplacePhoto_sellerProfileId_fkey" FOREIGN KEY ("sellerProfileId") REFERENCES "public"."SellerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkspaceContent" ADD CONSTRAINT "WorkspaceContent_sellerProfileId_fkey" FOREIGN KEY ("sellerProfileId") REFERENCES "public"."SellerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkspaceContentPhoto" ADD CONSTRAINT "WorkspaceContentPhoto_workspaceContentId_fkey" FOREIGN KEY ("workspaceContentId") REFERENCES "public"."WorkspaceContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkspaceContentProp" ADD CONSTRAINT "WorkspaceContentProp_workspaceContentId_fkey" FOREIGN KEY ("workspaceContentId") REFERENCES "public"."WorkspaceContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkspaceContentProp" ADD CONSTRAINT "WorkspaceContentProp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkspaceContentComment" ADD CONSTRAINT "WorkspaceContentComment_workspaceContentId_fkey" FOREIGN KEY ("workspaceContentId") REFERENCES "public"."WorkspaceContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkspaceContentComment" ADD CONSTRAINT "WorkspaceContentComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkspaceContentComment" ADD CONSTRAINT "WorkspaceContentComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."WorkspaceContentComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Recipe" ADD CONSTRAINT "Recipe_workspaceContentId_fkey" FOREIGN KEY ("workspaceContentId") REFERENCES "public"."WorkspaceContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GrowingProcess" ADD CONSTRAINT "GrowingProcess_workspaceContentId_fkey" FOREIGN KEY ("workspaceContentId") REFERENCES "public"."WorkspaceContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DesignItem" ADD CONSTRAINT "DesignItem_workspaceContentId_fkey" FOREIGN KEY ("workspaceContentId") REFERENCES "public"."WorkspaceContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
