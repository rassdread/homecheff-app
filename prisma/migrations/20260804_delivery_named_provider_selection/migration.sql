-- Additive Phase 3: named provider selection, acceptance mode, capacity, booking requests, calendar.
-- Non-destructive. No historical rewrite.

ALTER TABLE "DeliveryProfile" ADD COLUMN IF NOT EXISTS "acceptanceMode" TEXT NOT NULL DEFAULT 'MANUAL_CONFIRM';
ALTER TABLE "DeliveryProfile" ADD COLUMN IF NOT EXISTS "providerType" TEXT NOT NULL DEFAULT 'INDEPENDENT';
ALTER TABLE "DeliveryProfile" ADD COLUMN IF NOT EXISTS "workStartTime" TEXT;
ALTER TABLE "DeliveryProfile" ADD COLUMN IF NOT EXISTS "workEndTime" TEXT;
ALTER TABLE "DeliveryProfile" ADD COLUMN IF NOT EXISTS "breakWindows" JSONB;
ALTER TABLE "DeliveryProfile" ADD COLUMN IF NOT EXISTS "temporaryOffline" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "DeliveryProfile" ADD COLUMN IF NOT EXISTS "vacationStart" TIMESTAMP(3);
ALTER TABLE "DeliveryProfile" ADD COLUMN IF NOT EXISTS "vacationEnd" TIMESTAMP(3);
ALTER TABLE "DeliveryProfile" ADD COLUMN IF NOT EXISTS "maxSimultaneousDeliveries" INTEGER NOT NULL DEFAULT 3;
ALTER TABLE "DeliveryProfile" ADD COLUMN IF NOT EXISTS "maxDeliveriesPerSlot" INTEGER NOT NULL DEFAULT 2;
ALTER TABLE "DeliveryProfile" ADD COLUMN IF NOT EXISTS "preparationTimeMinutes" INTEGER NOT NULL DEFAULT 15;
ALTER TABLE "DeliveryProfile" ADD COLUMN IF NOT EXISTS "estimatedPickupDelayMinutes" INTEGER NOT NULL DEFAULT 10;

CREATE TABLE IF NOT EXISTS "DeliveryBookingRequest" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "deliveryProfileId" TEXT NOT NULL,
    "productId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "acceptanceModeSnapshot" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "quotedFeeCents" INTEGER,
    "routeDistanceKm" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "buyerLat" DOUBLE PRECISION,
    "buyerLng" DOUBLE PRECISION,
    "notes" TEXT,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DeliveryBookingRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "DeliveryBookingRequest_deliveryProfileId_status_idx" ON "DeliveryBookingRequest"("deliveryProfileId", "status");
CREATE INDEX IF NOT EXISTS "DeliveryBookingRequest_buyerId_status_idx" ON "DeliveryBookingRequest"("buyerId", "status");
CREATE INDEX IF NOT EXISTS "DeliveryBookingRequest_expiresAt_idx" ON "DeliveryBookingRequest"("expiresAt");

DO $$ BEGIN
  ALTER TABLE "DeliveryBookingRequest" ADD CONSTRAINT "DeliveryBookingRequest_deliveryProfileId_fkey"
    FOREIGN KEY ("deliveryProfileId") REFERENCES "DeliveryProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "DeliveryBookingRequest" ADD CONSTRAINT "DeliveryBookingRequest_buyerId_fkey"
    FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "DeliveryCalendarEntry" (
    "id" TEXT NOT NULL,
    "deliveryProfileId" TEXT NOT NULL,
    "deliveryOrderId" TEXT,
    "bookingRequestId" TEXT,
    "title" TEXT NOT NULL,
    "pickupAt" TIMESTAMP(3),
    "deliverAt" TIMESTAMP(3),
    "travelTimeMinutes" INTEGER,
    "estimatedDurationMinutes" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "orderReference" TEXT,
    "earningsCents" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DeliveryCalendarEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "DeliveryCalendarEntry_deliveryProfileId_pickupAt_idx" ON "DeliveryCalendarEntry"("deliveryProfileId", "pickupAt");
CREATE INDEX IF NOT EXISTS "DeliveryCalendarEntry_deliveryOrderId_idx" ON "DeliveryCalendarEntry"("deliveryOrderId");

DO $$ BEGIN
  ALTER TABLE "DeliveryCalendarEntry" ADD CONSTRAINT "DeliveryCalendarEntry_deliveryProfileId_fkey"
    FOREIGN KEY ("deliveryProfileId") REFERENCES "DeliveryProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "DeliveryCalendarEntry" ADD CONSTRAINT "DeliveryCalendarEntry_bookingRequestId_fkey"
    FOREIGN KEY ("bookingRequestId") REFERENCES "DeliveryBookingRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
