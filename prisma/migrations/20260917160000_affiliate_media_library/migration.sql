-- Affiliate promotional media library (not Marketplace listings / feed).

CREATE TYPE "AffiliateMediaKind" AS ENUM ('IMAGE', 'VIDEO');
CREATE TYPE "AffiliateMediaVisibility" AS ENUM ('PRIVATE', 'AFFILIATE_COMMUNITY', 'OFFICIAL');
CREATE TYPE "AffiliateMediaModerationStatus" AS ENUM ('DRAFT', 'ACTIVE', 'UNDER_REVIEW', 'REJECTED', 'ARCHIVED');

CREATE TABLE "AffiliateMediaAsset" (
    "id" TEXT NOT NULL,
    "creatorUserId" TEXT NOT NULL,
    "kind" "AffiliateMediaKind" NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mediaUrl" TEXT NOT NULL,
    "posterUrl" TEXT,
    "posterStorageKey" TEXT,
    "mimeType" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "durationMs" INTEGER,
    "title" TEXT,
    "caption" TEXT,
    "ctaText" TEXT,
    "visibility" "AffiliateMediaVisibility" NOT NULL,
    "moderationStatus" "AffiliateMediaModerationStatus" NOT NULL DEFAULT 'DRAFT',
    "reuseConsentAt" TIMESTAMP(3),
    "shareSlug" TEXT NOT NULL,
    "destinationPath" TEXT NOT NULL DEFAULT '/',
    "language" TEXT,
    "region" TEXT,
    "campaignTag" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "AffiliateMediaAsset_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AffiliateMediaAsset_shareSlug_key" ON "AffiliateMediaAsset"("shareSlug");
CREATE INDEX "AffiliateMediaAsset_creatorUserId_createdAt_idx" ON "AffiliateMediaAsset"("creatorUserId", "createdAt");
CREATE INDEX "AffiliateMediaAsset_visibility_moderationStatus_createdAt_idx" ON "AffiliateMediaAsset"("visibility", "moderationStatus", "createdAt");
CREATE INDEX "AffiliateMediaAsset_deletedAt_idx" ON "AffiliateMediaAsset"("deletedAt");

ALTER TABLE "AffiliateMediaAsset"
  ADD CONSTRAINT "AffiliateMediaAsset_creatorUserId_fkey"
  FOREIGN KEY ("creatorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "AffiliateMediaShareEvent" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "sharingAffiliateId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AffiliateMediaShareEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AffiliateMediaShareEvent_assetId_createdAt_idx" ON "AffiliateMediaShareEvent"("assetId", "createdAt");
CREATE INDEX "AffiliateMediaShareEvent_sharingAffiliateId_createdAt_idx" ON "AffiliateMediaShareEvent"("sharingAffiliateId", "createdAt");

ALTER TABLE "AffiliateMediaShareEvent"
  ADD CONSTRAINT "AffiliateMediaShareEvent_assetId_fkey"
  FOREIGN KEY ("assetId") REFERENCES "AffiliateMediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AffiliateMediaShareEvent"
  ADD CONSTRAINT "AffiliateMediaShareEvent_sharingAffiliateId_fkey"
  FOREIGN KEY ("sharingAffiliateId") REFERENCES "Affiliate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "AffiliateMediaClickEvent" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "sharingAffiliateId" TEXT,
    "refCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AffiliateMediaClickEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AffiliateMediaClickEvent_assetId_createdAt_idx" ON "AffiliateMediaClickEvent"("assetId", "createdAt");

ALTER TABLE "AffiliateMediaClickEvent"
  ADD CONSTRAINT "AffiliateMediaClickEvent_assetId_fkey"
  FOREIGN KEY ("assetId") REFERENCES "AffiliateMediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AffiliateMediaClickEvent"
  ADD CONSTRAINT "AffiliateMediaClickEvent_sharingAffiliateId_fkey"
  FOREIGN KEY ("sharingAffiliateId") REFERENCES "Affiliate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
