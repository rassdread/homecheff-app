ALTER TABLE "DeliveryBookingRequest" ADD COLUMN IF NOT EXISTS "cargoFitRequired" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "DeliveryBookingRequest" ADD COLUMN IF NOT EXISTS "cargoFitConfirmedAt" TIMESTAMP(3);
ALTER TABLE "DeliveryBookingRequest" ADD COLUMN IF NOT EXISTS "cargoFitFingerprint" TEXT;
ALTER TABLE "StandaloneDeliveryRequest" ADD COLUMN IF NOT EXISTS "cargoFitRequired" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "StandaloneDeliveryRequest" ADD COLUMN IF NOT EXISTS "cargoFitConfirmedAt" TIMESTAMP(3);
ALTER TABLE "StandaloneDeliveryRequest" ADD COLUMN IF NOT EXISTS "cargoFitFingerprint" TEXT;
ALTER TABLE "DeliveryTransportProposal" ADD COLUMN IF NOT EXISTS "cargoFitConfirmed" BOOLEAN NOT NULL DEFAULT false;
