-- Marketplace video jobs are separate from Studio render records.
CREATE TABLE "MarketplaceVideoJob" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "listingId" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "failureCode" TEXT,
    "canonicalUrl" TEXT,
    "posterUrl" TEXT,
    "probeJson" JSONB,
    "maxDurationSeconds" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplaceVideoJob_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MarketplaceVideoJob_ownerUserId_createdAt_idx" ON "MarketplaceVideoJob"("ownerUserId", "createdAt");
