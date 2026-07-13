/*
  Warnings:

  - You are about to drop the `Review` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updatedAt` to the `Conversation` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."MessageType" AS ENUM ('TEXT', 'IMAGE', 'FILE', 'PRODUCT_SHARE', 'SYSTEM');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."NotificationType" ADD VALUE 'NEW_CONVERSATION';
ALTER TYPE "public"."NotificationType" ADD VALUE 'MESSAGE_REACTION';

-- DropForeignKey
ALTER TABLE "public"."Review" DROP CONSTRAINT "Review_listingId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Review" DROP CONSTRAINT "Review_revieweeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Review" DROP CONSTRAINT "Review_reviewerId_fkey";

-- AlterTable
ALTER TABLE "public"."Conversation" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastMessageAt" TIMESTAMP(3),
ADD COLUMN     "productId" TEXT,
ADD COLUMN     "title" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."Dish" ADD COLUMN     "maxStock" INTEGER,
ADD COLUMN     "stock" INTEGER DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."DishPhoto" ADD COLUMN     "isMain" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."Message" ADD COLUMN     "attachmentName" TEXT,
ADD COLUMN     "attachmentType" TEXT,
ADD COLUMN     "attachmentUrl" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "editedAt" TIMESTAMP(3),
ADD COLUMN     "messageType" "public"."MessageType" NOT NULL DEFAULT 'TEXT',
ALTER COLUMN "text" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "displayNameType" TEXT NOT NULL DEFAULT 'fullname',
ADD COLUMN     "maxStock" INTEGER,
ADD COLUMN     "stock" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "accountHolderName" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "buyerRoles" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "displayFullName" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "iban" TEXT,
ADD COLUMN     "marketingAccepted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "marketingAcceptedAt" TIMESTAMP(3),
ADD COLUMN     "privacyPolicyAccepted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "privacyPolicyAcceptedAt" TIMESTAMP(3),
ADD COLUMN     "sellerRoles" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "stripeConnectAccountId" TEXT,
ADD COLUMN     "stripeConnectOnboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "taxResponsibilityAccepted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "taxResponsibilityAcceptedAt" TIMESTAMP(3),
ADD COLUMN     "termsAccepted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "termsAcceptedAt" TIMESTAMP(3);

-- DropTable
DROP TABLE "public"."Review";

-- CreateTable
CREATE TABLE "public"."ProductReview" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "orderId" TEXT,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "comment" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReviewImage" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ReviewImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReviewResponse" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductReview_productId_idx" ON "public"."ProductReview"("productId");

-- CreateIndex
CREATE INDEX "ProductReview_buyerId_idx" ON "public"."ProductReview"("buyerId");

-- CreateIndex
CREATE INDEX "ProductReview_rating_idx" ON "public"."ProductReview"("rating");

-- CreateIndex
CREATE UNIQUE INDEX "ProductReview_productId_buyerId_key" ON "public"."ProductReview"("productId", "buyerId");

-- CreateIndex
CREATE INDEX "ReviewImage_reviewId_idx" ON "public"."ReviewImage"("reviewId");

-- CreateIndex
CREATE INDEX "ReviewResponse_reviewId_idx" ON "public"."ReviewResponse"("reviewId");

-- CreateIndex
CREATE INDEX "ReviewResponse_sellerId_idx" ON "public"."ReviewResponse"("sellerId");

-- CreateIndex
CREATE INDEX "Conversation_productId_idx" ON "public"."Conversation"("productId");

-- CreateIndex
CREATE INDEX "Conversation_lastMessageAt_idx" ON "public"."Conversation"("lastMessageAt");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "public"."Message"("senderId");

-- AddForeignKey
ALTER TABLE "public"."Conversation" ADD CONSTRAINT "Conversation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductReview" ADD CONSTRAINT "ProductReview_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductReview" ADD CONSTRAINT "ProductReview_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductReview" ADD CONSTRAINT "ProductReview_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReviewImage" ADD CONSTRAINT "ReviewImage_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "public"."ProductReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReviewResponse" ADD CONSTRAINT "ReviewResponse_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "public"."ProductReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReviewResponse" ADD CONSTRAINT "ReviewResponse_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
