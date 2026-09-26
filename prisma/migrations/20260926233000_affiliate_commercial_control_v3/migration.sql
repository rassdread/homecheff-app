-- Public availability flags and versioned future policies.
-- Does not rewrite enrollments, ledgers, hierarchy, promos, or current economics.

ALTER TABLE "AffiliateMarketRecruitment" ADD COLUMN "desiredRegionalCount" INTEGER;
ALTER TABLE "AffiliateMarketRecruitment" ADD COLUMN "publicMainAvailable" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "AffiliateMarketRecruitment" ADD COLUMN "publicNetworkAvailable" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "AffiliateMarketRecruitment" ADD COLUMN "publicPromoAvailable" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "AffiliateProgramEnrollment" ADD COLUMN "capturedCapabilities" JSONB;

ALTER TABLE "AffiliateCapabilityOverride" ADD COLUMN "privateCollaboration" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "AffiliateCommercialPolicy" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "durationMode" TEXT NOT NULL DEFAULT 'WHILE_QUALIFYING',
    "durationMonths" INTEGER,
    "durationClock" TEXT,
    "directPoolBps" INTEGER,
    "subPoolBps" INTEGER,
    "mainPoolBps" INTEGER,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AffiliateCommercialPolicy_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AffiliateCommercialPolicy_code_key" ON "AffiliateCommercialPolicy"("code");
CREATE INDEX "AffiliateCommercialPolicy_status_idx" ON "AffiliateCommercialPolicy"("status");

INSERT INTO "AffiliateCommercialPolicy" (
    "id", "code", "status", "durationMode", "durationMonths", "durationClock",
    "directPoolBps", "subPoolBps", "mainPoolBps", "publishedAt", "createdAt", "updatedAt"
) VALUES (
    'policy-certified-current',
    'CERTIFIED_CURRENT_ECONOMICS',
    'PUBLISHED',
    'WHILE_QUALIFYING',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
