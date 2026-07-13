-- AlterEnum (idempotent for shadow / re-run)
DO $$ BEGIN
  ALTER TYPE "AttributionSource" ADD VALUE 'ANDROID_BETA_DOWNLOAD';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "betaTesterJoinedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "androidBetaOnboardingCompletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "NotificationPreferences" ADD COLUMN IF NOT EXISTS "pushHcpRewards" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "pushPromotionalUpdates" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "betaFeaturesEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE IF NOT EXISTS "BetaDownloadEvent" (
    "id" TEXT NOT NULL,
    "refCode" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BetaDownloadEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "BetaDownloadEvent_createdAt_idx" ON "BetaDownloadEvent"("createdAt");
CREATE INDEX IF NOT EXISTS "BetaDownloadEvent_refCode_idx" ON "BetaDownloadEvent"("refCode");
