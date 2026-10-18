-- Standalone HomeCheff Delivery.
-- A paid courier job can exist without a marketplace Order.
-- Existing rows stay origin = MARKETPLACE and keep their orderId.
-- Production rollout: apply this migration before the app version that reads the new columns.
-- This audit applies it only to the isolated database hc_v6_mkt.

ALTER TABLE "DeliveryOrder" ALTER COLUMN "orderId" DROP NOT NULL;

ALTER TABLE "DeliveryOrder" ADD COLUMN "origin" TEXT NOT NULL DEFAULT 'MARKETPLACE';
ALTER TABLE "DeliveryOrder" ADD COLUMN "requesterUserId" TEXT;
ALTER TABLE "DeliveryOrder" ADD COLUMN "pickupAddress" TEXT;
ALTER TABLE "DeliveryOrder" ADD COLUMN "itemDescription" TEXT;

CREATE INDEX "DeliveryOrder_requesterUserId_idx" ON "DeliveryOrder"("requesterUserId");
CREATE INDEX "DeliveryOrder_origin_idx" ON "DeliveryOrder"("origin");

CREATE TABLE "StandaloneDeliveryRequest" (
    "id" TEXT NOT NULL,
    "requesterUserId" TEXT NOT NULL,
    "pickupAddress" TEXT NOT NULL,
    "deliveryAddress" TEXT NOT NULL,
    "pickupLat" DOUBLE PRECISION NOT NULL,
    "pickupLng" DOUBLE PRECISION NOT NULL,
    "dropoffLat" DOUBLE PRECISION NOT NULL,
    "dropoffLng" DOUBLE PRECISION NOT NULL,
    "itemDescription" TEXT NOT NULL,
    "deliveryProfileId" TEXT NOT NULL,
    "providerDisplayName" TEXT NOT NULL,
    "quotedFeeCents" INTEGER NOT NULL,
    "stripeFeeCents" INTEGER NOT NULL,
    "buyerTotalCents" INTEGER NOT NULL,
    "routeDistanceKm" DOUBLE PRECISION NOT NULL,
    "baseFeeCents" INTEGER NOT NULL,
    "pricePerKmCents" INTEGER NOT NULL,
    "minimumFeeCents" INTEGER NOT NULL,
    "platformCommissionCents" INTEGER NOT NULL,
    "providerNetPayoutCents" INTEGER NOT NULL,
    "quoteExpiresAt" TIMESTAMP(3) NOT NULL,
    "stripeSessionId" TEXT,
    "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
    "status" TEXT NOT NULL DEFAULT 'QUOTED',
    "deliveryOrderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StandaloneDeliveryRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StandaloneDeliveryRequest_stripeSessionId_key" ON "StandaloneDeliveryRequest"("stripeSessionId");
CREATE UNIQUE INDEX "StandaloneDeliveryRequest_deliveryOrderId_key" ON "StandaloneDeliveryRequest"("deliveryOrderId");
CREATE INDEX "StandaloneDeliveryRequest_requesterUserId_idx" ON "StandaloneDeliveryRequest"("requesterUserId");

ALTER TABLE "StandaloneDeliveryRequest" ADD CONSTRAINT "StandaloneDeliveryRequest_requesterUserId_fkey" FOREIGN KEY ("requesterUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StandaloneDeliveryRequest" ADD CONSTRAINT "StandaloneDeliveryRequest_deliveryProfileId_fkey" FOREIGN KEY ("deliveryProfileId") REFERENCES "DeliveryProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
