-- CreateEnum
CREATE TYPE "HcpCarouselPlacement" AS ENUM ('HOME', 'RANKINGS', 'BOTH');

-- CreateEnum
CREATE TYPE "HcpCarouselTargetType" AS ENUM ('GLOBAL', 'COUNTRY', 'RADIUS');

-- AlterTable
ALTER TABLE "HcpCarouselSlide" ADD COLUMN "placement" "HcpCarouselPlacement" NOT NULL DEFAULT 'BOTH';

-- AlterTable
ALTER TABLE "HcpCarouselSlide" ADD COLUMN "targetType" "HcpCarouselTargetType" NOT NULL DEFAULT 'GLOBAL';

-- AlterTable
ALTER TABLE "HcpCarouselSlide" ADD COLUMN "targetCountry" TEXT;

-- AlterTable
ALTER TABLE "HcpCarouselSlide" ADD COLUMN "targetLat" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "HcpCarouselSlide" ADD COLUMN "targetLng" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "HcpCarouselSlide" ADD COLUMN "targetRadiusKm" INTEGER;

-- CreateIndex
CREATE INDEX "HcpCarouselSlide_placement_idx" ON "HcpCarouselSlide"("placement");
