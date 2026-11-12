-- Transport proposals reuse the existing gram and centimetre capacity columns.
-- Those columns are not created again and are not converted to kilograms.
ALTER TYPE "TransportationMode" ADD VALUE IF NOT EXISTS 'ESTATE';
ALTER TYPE "TransportationMode" ADD VALUE IF NOT EXISTS 'VAN';
ALTER TYPE "TransportationMode" ADD VALUE IF NOT EXISTS 'BOX_TRUCK';
ALTER TYPE "TransportationMode" ADD VALUE IF NOT EXISTS 'TRAILER';

ALTER TABLE "DeliveryProfile" ADD COLUMN IF NOT EXISTS "vehicleCapacityStatus" JSONB;

ALTER TABLE "StandaloneDeliveryRequest" ADD COLUMN IF NOT EXISTS "jobKind" TEXT NOT NULL DEFAULT 'SIMPLE';
ALTER TABLE "StandaloneDeliveryRequest" ADD COLUMN IF NOT EXISTS "cargo" JSONB;
ALTER TABLE "StandaloneDeliveryRequest" ADD COLUMN IF NOT EXISTS "proposalExpiresAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "DeliveryTransportProposal" (
  "id" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "authorUserId" TEXT NOT NULL,
  "authorRole" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "priceCents" INTEGER,
  "note" TEXT,
  "status" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DeliveryTransportProposal_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DeliveryTransportProposal_requestId_version_key"
  ON "DeliveryTransportProposal"("requestId", "version");
CREATE INDEX IF NOT EXISTS "DeliveryTransportProposal_requestId_status_idx"
  ON "DeliveryTransportProposal"("requestId", "status");

DO $$ BEGIN
  ALTER TABLE "DeliveryTransportProposal"
    ADD CONSTRAINT "DeliveryTransportProposal_requestId_fkey"
    FOREIGN KEY ("requestId") REFERENCES "StandaloneDeliveryRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "DeliveryCargoPhoto" (
  "id" TEXT NOT NULL,
  "ownerUserId" TEXT NOT NULL,
  "requestId" TEXT,
  "objectKey" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "DeliveryCargoPhoto_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DeliveryCargoPhoto_objectKey_key" ON "DeliveryCargoPhoto"("objectKey");
CREATE INDEX IF NOT EXISTS "DeliveryCargoPhoto_ownerUserId_idx" ON "DeliveryCargoPhoto"("ownerUserId");
CREATE INDEX IF NOT EXISTS "DeliveryCargoPhoto_requestId_idx" ON "DeliveryCargoPhoto"("requestId");

DO $$ BEGIN
  ALTER TABLE "DeliveryCargoPhoto"
    ADD CONSTRAINT "DeliveryCargoPhoto_requestId_fkey"
    FOREIGN KEY ("requestId") REFERENCES "StandaloneDeliveryRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
