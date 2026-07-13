/*
  Warnings:

  - You are about to drop the `Company` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Company" DROP CONSTRAINT "Company_userId_fkey";

-- DropTable
DROP TABLE "public"."Company";

-- CreateTable
CREATE TABLE "public"."Business" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kvkNumber" TEXT,
    "vatNumber" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT DEFAULT 'NL',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "workplacePhotos" TEXT[],

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Business_userId_key" ON "public"."Business"("userId");

-- CreateIndex
CREATE INDEX "Business_userId_idx" ON "public"."Business"("userId");

-- AddForeignKey
ALTER TABLE "public"."Business" ADD CONSTRAINT "Business_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
