/*
  Warnings:

  - You are about to drop the column `sellerProfileId` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the column `verificationDocumentUrl` on the `SellerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `verificationStatus` on the `SellerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `passwordHash` on the `User` table. All the data in the column will be lost.
  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Made the column `productId` on table `Image` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."Image" DROP CONSTRAINT "Image_productId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Image" DROP CONSTRAINT "Image_sellerProfileId_fkey";

-- AlterTable
ALTER TABLE "public"."Image" DROP COLUMN "sellerProfileId",
ALTER COLUMN "productId" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."SellerProfile" DROP COLUMN "verificationDocumentUrl",
DROP COLUMN "verificationStatus",
ADD COLUMN     "btw" TEXT,
ADD COLUMN     "companyName" TEXT,
ADD COLUMN     "kvk" TEXT,
ADD COLUMN     "subscriptionId" TEXT,
ADD COLUMN     "subscriptionValidUntil" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "name",
DROP COLUMN "passwordHash",
ALTER COLUMN "updatedAt" SET NOT NULL,
DROP COLUMN "role",
ADD COLUMN     "role" "public"."UserRole" NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE "public"."Subscription" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "feeBps" INTEGER NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."SellerProfile" ADD CONSTRAINT "SellerProfile_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "public"."Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Image" ADD CONSTRAINT "Image_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
