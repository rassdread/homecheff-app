-- CreateEnum
CREATE TYPE "HcpCarouselSlideType" AS ENUM ('RANKING', 'PROMO', 'SPOTLIGHT', 'SPONSORED', 'INFO');

-- CreateTable
CREATE TABLE "HcpCarouselSlide" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "imageUrl" TEXT,
    "ctaLabel" TEXT,
    "ctaUrl" TEXT,
    "backgroundStyle" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "slideType" "HcpCarouselSlideType" NOT NULL DEFAULT 'PROMO',
    "localeFilter" TEXT,
    "countryFilter" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HcpCarouselSlide_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HcpCarouselSlide_isActive_sortOrder_idx" ON "HcpCarouselSlide"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "HcpCarouselSlide_startsAt_endsAt_idx" ON "HcpCarouselSlide"("startsAt", "endsAt");
