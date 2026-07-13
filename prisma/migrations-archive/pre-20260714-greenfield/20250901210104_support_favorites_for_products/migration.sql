/*
  Warnings:

  - The primary key for the `Favorite` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[userId,listingId]` on the table `Favorite` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,productId]` on the table `Favorite` will be added. If there are existing duplicate values, this will fail.
  - The required column `id` was added to the `Favorite` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "public"."Favorite" DROP CONSTRAINT "Favorite_pkey",
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "productId" TEXT,
ALTER COLUMN "listingId" DROP NOT NULL,
ADD CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE INDEX "Favorite_productId_idx" ON "public"."Favorite"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_listingId_key" ON "public"."Favorite"("userId", "listingId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_productId_key" ON "public"."Favorite"("userId", "productId");

-- AddForeignKey
ALTER TABLE "public"."Favorite" ADD CONSTRAINT "Favorite_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
