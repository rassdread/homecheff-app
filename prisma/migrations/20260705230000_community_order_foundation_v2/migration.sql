-- Community Order Foundation V2 — value settlement on proposals/agreements

-- CreateEnum
CREATE TYPE "CommunityOrderFulfillmentMode" AS ENUM (
  'PICKUP',
  'DELIVERY',
  'DIGITAL',
  'ON_SITE_PROVIDER',
  'ON_SITE_CLIENT'
);

-- AlterEnum NotificationType
ALTER TYPE "NotificationType" ADD VALUE 'PROPOSAL_ALTERNATIVE_VALUE';
ALTER TYPE "NotificationType" ADD VALUE 'PROPOSAL_MIXED_ACCEPTED';
ALTER TYPE "NotificationType" ADD VALUE 'COMMUNITY_ORDER_CREATED';

-- AlterTable Proposal
ALTER TABLE "Proposal" ADD COLUMN IF NOT EXISTS "acceptedValueTaxonomyIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Proposal" ADD COLUMN IF NOT EXISTS "requestedValueTaxonomyIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Proposal" ADD COLUMN IF NOT EXISTS "proposalSummary" JSONB;

CREATE INDEX IF NOT EXISTS "Proposal_acceptedValueTaxonomyIds_idx" ON "Proposal" USING GIN ("acceptedValueTaxonomyIds");
CREATE INDEX IF NOT EXISTS "Proposal_requestedValueTaxonomyIds_idx" ON "Proposal" USING GIN ("requestedValueTaxonomyIds");

-- AlterTable Agreement
ALTER TABLE "Agreement" ADD COLUMN IF NOT EXISTS "agreementSummary" JSONB;

-- AlterTable CommunityOrder
ALTER TABLE "CommunityOrder" ADD COLUMN IF NOT EXISTS "fulfillmentMode" "CommunityOrderFulfillmentMode";
ALTER TABLE "CommunityOrder" ADD COLUMN IF NOT EXISTS "deliveryRequested" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "CommunityOrder" ADD COLUMN IF NOT EXISTS "deliveryAssigned" BOOLEAN NOT NULL DEFAULT false;
