-- Affiliate launch program. Does not rewrite ledgers, attributions, promos, or hierarchy.

CREATE TABLE "AffiliateProgram" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveUntil" TIMESTAMP(3),
    "isPublicDefault" BOOLEAN NOT NULL DEFAULT false,
    "publicEarlyEnabled" BOOLEAN NOT NULL DEFAULT false,
    "commissionPolicyRef" TEXT NOT NULL,
    "durationPolicyRef" TEXT NOT NULL,
    "termsVersion" TEXT NOT NULL,
    "subAffiliateLimit" INTEGER,
    "capabilities" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AffiliateProgram_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AffiliateProgram_code_key" ON "AffiliateProgram"("code");
CREATE INDEX "AffiliateProgram_status_idx" ON "AffiliateProgram"("status");
CREATE INDEX "AffiliateProgram_isPublicDefault_idx" ON "AffiliateProgram"("isPublicDefault");

CREATE TABLE "AffiliateMarketRecruitment" (
    "id" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "regionCode" TEXT NOT NULL DEFAULT '',
    "homecheffActive" BOOLEAN NOT NULL DEFAULT true,
    "recruitmentState" TEXT NOT NULL DEFAULT 'OPEN',
    "programId" TEXT,
    "desiredMainCount" INTEGER,
    "desiredActiveCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AffiliateMarketRecruitment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AffiliateMarketRecruitment_countryCode_regionCode_key" ON "AffiliateMarketRecruitment"("countryCode", "regionCode");
CREATE INDEX "AffiliateMarketRecruitment_recruitmentState_idx" ON "AffiliateMarketRecruitment"("recruitmentState");

ALTER TABLE "AffiliateMarketRecruitment" ADD CONSTRAINT "AffiliateMarketRecruitment_programId_fkey" FOREIGN KEY ("programId") REFERENCES "AffiliateProgram"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "AffiliateProgramEnrollment" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "marketCountry" TEXT NOT NULL DEFAULT 'NL',
    "source" TEXT NOT NULL,
    "termsVersion" TEXT NOT NULL,
    "termsAcceptedAt" TIMESTAMP(3),
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AffiliateProgramEnrollment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AffiliateProgramEnrollment_affiliateId_key" ON "AffiliateProgramEnrollment"("affiliateId");
CREATE INDEX "AffiliateProgramEnrollment_programId_idx" ON "AffiliateProgramEnrollment"("programId");
CREATE INDEX "AffiliateProgramEnrollment_source_idx" ON "AffiliateProgramEnrollment"("source");

ALTER TABLE "AffiliateProgramEnrollment" ADD CONSTRAINT "AffiliateProgramEnrollment_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AffiliateProgramEnrollment" ADD CONSTRAINT "AffiliateProgramEnrollment_programId_fkey" FOREIGN KEY ("programId") REFERENCES "AffiliateProgram"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "AffiliateCapabilityOverride" (
    "affiliateId" TEXT NOT NULL,
    "directCommission" BOOLEAN,
    "promoCodes" BOOLEAN,
    "promoLibrary" BOOLEAN,
    "inviteSubs" BOOLEAN,
    "becomeMain" BOOLEAN,
    "earnMainOverride" BOOLEAN,
    "networkDashboard" BOOLEAN,
    "commissionCatalog" BOOLEAN,
    "advancedTools" BOOLEAN,
    "newMarket" BOOLEAN,
    "subLimitMode" TEXT NOT NULL DEFAULT 'INHERIT',
    "subLimit" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AffiliateCapabilityOverride_pkey" PRIMARY KEY ("affiliateId")
);

ALTER TABLE "AffiliateCapabilityOverride" ADD CONSTRAINT "AffiliateCapabilityOverride_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "AffiliateCommercialAudit" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "previous" JSONB,
    "next" JSONB,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AffiliateCommercialAudit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AffiliateCommercialAudit_targetType_targetId_idx" ON "AffiliateCommercialAudit"("targetType", "targetId");
CREATE INDEX "AffiliateCommercialAudit_createdAt_idx" ON "AffiliateCommercialAudit"("createdAt");

INSERT INTO "AffiliateProgram" (
    "id", "code", "name", "status", "effectiveFrom", "effectiveUntil",
    "isPublicDefault", "publicEarlyEnabled", "commissionPolicyRef", "durationPolicyRef",
    "termsVersion", "subAffiliateLimit", "capabilities", "createdAt", "updatedAt"
) VALUES (
    'early-affiliate-v1',
    'EARLY_AFFILIATE_V1',
    'Vroege instap',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    NULL,
    true,
    true,
    'CERTIFIED_CURRENT_ECONOMICS',
    'QUALIFYING_WHILE_ACTIVE',
    'EARLY_AFFILIATE_V1_TERMS',
    NULL,
    '{"CAN_EARN_DIRECT_COMMISSION":true,"CAN_CREATE_PROMO_CODES":true,"CAN_USE_PROMO_LIBRARY":true,"CAN_INVITE_SUB_AFFILIATES":true,"CAN_HAVE_SUB_AFFILIATES":true,"CAN_BECOME_MAIN":true,"CAN_EARN_MAIN_OVERRIDE":true,"CAN_ACCESS_NETWORK_DASHBOARD":true,"CAN_ACCESS_COMMISSION_CATALOG":true,"CAN_ACCESS_ADVANCED_AFFILIATE_TOOLS":true,"CAN_REQUEST_NEW_MARKET":true}',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

INSERT INTO "AffiliateMarketRecruitment" (
    "id", "countryCode", "regionCode", "homecheffActive", "recruitmentState",
    "programId", "createdAt", "updatedAt"
) VALUES (
    'market-nl',
    'NL',
    '',
    true,
    'OPEN',
    'early-affiliate-v1',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

INSERT INTO "AffiliateProgramEnrollment" (
    "id", "affiliateId", "programId", "marketCountry", "source",
    "termsVersion", "termsAcceptedAt", "enrolledAt", "createdAt", "updatedAt"
)
SELECT
    "id",
    "id",
    'early-affiliate-v1',
    'NL',
    'MIGRATED_EXISTING',
    'EARLY_AFFILIATE_V1_TERMS',
    NULL,
    "createdAt",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Affiliate";
