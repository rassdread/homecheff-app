-- Additive HC_ONLY marketplace payment fields (dormant until pilot flags ON).

CREATE TYPE "OrderPaymentMethod" AS ENUM ('EUR_STRIPE', 'HC_ONLY', 'MIXED_HC_EUR');
CREATE TYPE "HcPaymentPhase" AS ENUM ('HC_RESERVED', 'ORDER_ACCEPTED', 'HC_CAPTURED', 'SETTLEMENT_EARNED', 'RELEASED', 'FAILED');
CREATE TYPE "MarketplaceHcSettlementStatus" AS ENUM ('PENDING', 'EARNED', 'VOID', 'REVERSED');
CREATE TYPE "MarketplaceHcSettlementSource" AS ENUM ('HOMECHEFF_TREASURY', 'ORGANIZATION_PROGRAM');

ALTER TABLE "Order" ADD COLUMN "paymentMethod" "OrderPaymentMethod" NOT NULL DEFAULT 'EUR_STRIPE';
ALTER TABLE "Order" ADD COLUMN "hcReservationId" TEXT;
ALTER TABLE "Order" ADD COLUMN "hcCapturedHc" INTEGER;
ALTER TABLE "Order" ADD COLUMN "hcPaymentPhase" "HcPaymentPhase";
ALTER TABLE "Order" ADD COLUMN "buyerCentralUserId" TEXT;

CREATE TABLE "MarketplaceHcSettlementExposure" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "sellerUserId" TEXT NOT NULL,
    "buyerCentralUserId" TEXT NOT NULL,
    "hcCaptured" INTEGER NOT NULL,
    "hcFaceValueCents" INTEGER NOT NULL,
    "grossOrderCents" INTEGER NOT NULL,
    "sellerTier" TEXT NOT NULL DEFAULT 'individual',
    "theoreticalPlatformFeeCents" INTEGER NOT NULL,
    "platformFeePolicy" TEXT NOT NULL DEFAULT 'THEORETICAL_POLICY_PENDING',
    "sellerGrossEntitlementCents" INTEGER NOT NULL,
    "sellerNetExposureCents" INTEGER NOT NULL,
    "settlementSource" "MarketplaceHcSettlementSource" NOT NULL DEFAULT 'HOMECHEFF_TREASURY',
    "status" "MarketplaceHcSettlementStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplaceHcSettlementExposure_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MarketplaceHcSettlementExposure_orderId_key" ON "MarketplaceHcSettlementExposure"("orderId");
CREATE INDEX "MarketplaceHcSettlementExposure_sellerUserId_idx" ON "MarketplaceHcSettlementExposure"("sellerUserId");
CREATE INDEX "MarketplaceHcSettlementExposure_status_idx" ON "MarketplaceHcSettlementExposure"("status");

ALTER TABLE "MarketplaceHcSettlementExposure" ADD CONSTRAINT "MarketplaceHcSettlementExposure_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
