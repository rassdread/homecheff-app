-- Proposal Foundation V1 (additive only)

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'COUNTERED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProposalFulfillmentType" AS ENUM ('PICKUP', 'DELIVERY');

-- CreateEnum
CREATE TYPE "ProposalCategory" AS ENUM ('PRODUCT', 'SERVICE', 'TASK', 'REQUEST');

-- CreateEnum
CREATE TYPE "SettlementMode" AS ENUM ('MONEY', 'MONEY_AND_VALUE', 'VALUE_ONLY', 'FREE', 'VOLUNTARY');

-- CreateEnum
CREATE TYPE "CommunityOrderStatus" AS ENUM ('OPEN', 'COMPLETED', 'CANCELLED');

-- AlterEnum MessageType
ALTER TYPE "MessageType" ADD VALUE 'PROPOSAL';
ALTER TYPE "MessageType" ADD VALUE 'PROPOSAL_SYSTEM';

-- AlterEnum NotificationType
ALTER TYPE "NotificationType" ADD VALUE 'PROPOSAL_RECEIVED';
ALTER TYPE "NotificationType" ADD VALUE 'PROPOSAL_ACCEPTED';
ALTER TYPE "NotificationType" ADD VALUE 'PROPOSAL_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE 'PROPOSAL_COUNTERED';

-- AlterTable Message
ALTER TABLE "Message" ADD COLUMN "proposalId" TEXT;

-- CreateTable Proposal
CREATE TABLE "Proposal" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "productId" TEXT,
    "listingId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER,
    "amountCents" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "requestedDate" TIMESTAMP(3),
    "requestedTimeWindow" TEXT,
    "fulfillmentType" "ProposalFulfillmentType",
    "category" "ProposalCategory" NOT NULL DEFAULT 'PRODUCT',
    "settlementMode" "SettlementMode" NOT NULL DEFAULT 'MONEY',
    "status" "ProposalStatus" NOT NULL DEFAULT 'PENDING',
    "parentProposalId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable Agreement
CREATE TABLE "Agreement" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "acceptedById" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Agreement_pkey" PRIMARY KEY ("id")
);

-- CreateTable CommunityOrder
CREATE TABLE "CommunityOrder" (
    "id" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "status" "CommunityOrderStatus" NOT NULL DEFAULT 'OPEN',
    "checkoutOrderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Proposal_conversationId_status_createdAt_idx" ON "Proposal"("conversationId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Proposal_sellerId_status_idx" ON "Proposal"("sellerId", "status");

-- CreateIndex
CREATE INDEX "Proposal_buyerId_status_idx" ON "Proposal"("buyerId", "status");

-- CreateIndex
CREATE INDEX "Proposal_parentProposalId_idx" ON "Proposal"("parentProposalId");

-- CreateIndex
CREATE UNIQUE INDEX "Agreement_proposalId_key" ON "Agreement"("proposalId");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityOrder_agreementId_key" ON "CommunityOrder"("agreementId");

-- CreateIndex
CREATE INDEX "CommunityOrder_conversationId_idx" ON "CommunityOrder"("conversationId");

-- CreateIndex
CREATE INDEX "CommunityOrder_proposalId_idx" ON "CommunityOrder"("proposalId");

-- CreateIndex
CREATE INDEX "CommunityOrder_buyerId_status_idx" ON "CommunityOrder"("buyerId", "status");

-- CreateIndex
CREATE INDEX "CommunityOrder_sellerId_status_idx" ON "CommunityOrder"("sellerId", "status");

-- CreateIndex
CREATE INDEX "CommunityOrder_checkoutOrderId_idx" ON "CommunityOrder"("checkoutOrderId");

-- CreateIndex
CREATE INDEX "Message_proposalId_idx" ON "Message"("proposalId");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_parentProposalId_fkey" FOREIGN KEY ("parentProposalId") REFERENCES "Proposal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agreement" ADD CONSTRAINT "Agreement_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agreement" ADD CONSTRAINT "Agreement_acceptedById_fkey" FOREIGN KEY ("acceptedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityOrder" ADD CONSTRAINT "CommunityOrder_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "Agreement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityOrder" ADD CONSTRAINT "CommunityOrder_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityOrder" ADD CONSTRAINT "CommunityOrder_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityOrder" ADD CONSTRAINT "CommunityOrder_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityOrder" ADD CONSTRAINT "CommunityOrder_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityOrder" ADD CONSTRAINT "CommunityOrder_checkoutOrderId_fkey" FOREIGN KEY ("checkoutOrderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
