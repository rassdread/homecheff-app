-- LEGAL-4A: DSA platform applicability assessment + Business.verified metadata
CREATE TABLE IF NOT EXISTS "CompliancePlatformAssessment" (
    "id" TEXT NOT NULL,
    "dsaApplicabilityState" TEXT NOT NULL DEFAULT 'NOT_ASSESSED',
    "assessedAt" TIMESTAMP(3),
    "assessmentNote" TEXT,
    "reviewDueAt" TIMESTAMP(3),
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompliancePlatformAssessment_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMP(3);
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "verifiedNote" TEXT;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "verifiedByUserId" TEXT;

CREATE INDEX IF NOT EXISTS "Business_verified_idx" ON "Business"("verified");
