-- Phase 8C: community-proposed accepted values (pending taxonomy proposals)

CREATE TYPE "PendingAcceptedValueStatus" AS ENUM ('PENDING', 'APPROVED', 'MERGED', 'REJECTED');

CREATE TABLE "PendingAcceptedValueProposal" (
    "id" TEXT NOT NULL,
    "canonicalKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "category" "MarketplaceCategory" NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'nl',
    "listingCount" INTEGER NOT NULL DEFAULT 0,
    "userCount" INTEGER NOT NULL DEFAULT 0,
    "firstUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL,
    "status" "PendingAcceptedValueStatus" NOT NULL DEFAULT 'PENDING',
    "approvedTaxonomyId" TEXT,

    CONSTRAINT "PendingAcceptedValueProposal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PendingAcceptedValueProposalUser" (
    "proposalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PendingAcceptedValueProposalUser_pkey" PRIMARY KEY ("proposalId","userId")
);

CREATE UNIQUE INDEX "PendingAcceptedValueProposal_canonicalKey_key" ON "PendingAcceptedValueProposal"("canonicalKey");

CREATE INDEX "PendingAcceptedValueProposal_status_idx" ON "PendingAcceptedValueProposal"("status");

CREATE INDEX "PendingAcceptedValueProposal_listingCount_idx" ON "PendingAcceptedValueProposal"("listingCount" DESC);

CREATE INDEX "PendingAcceptedValueProposal_category_idx" ON "PendingAcceptedValueProposal"("category");

CREATE INDEX "PendingAcceptedValueProposal_language_idx" ON "PendingAcceptedValueProposal"("language");

CREATE INDEX "PendingAcceptedValueProposalUser_userId_idx" ON "PendingAcceptedValueProposalUser"("userId");

ALTER TABLE "PendingAcceptedValueProposalUser" ADD CONSTRAINT "PendingAcceptedValueProposalUser_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "PendingAcceptedValueProposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
