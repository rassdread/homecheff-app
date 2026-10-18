-- Link a standalone request to the existing DeliveryBookingRequest
-- and store the requested pickup time separately from the 5-minute
-- courier response deadline. Local hc_v6_mkt only until production
-- authorization. Existing rows stay valid: both columns are nullable.

ALTER TABLE "StandaloneDeliveryRequest" ADD COLUMN "requestedPickupAt" TIMESTAMP(3);
ALTER TABLE "StandaloneDeliveryRequest" ADD COLUMN "bookingRequestId" TEXT;

CREATE UNIQUE INDEX "StandaloneDeliveryRequest_bookingRequestId_key"
  ON "StandaloneDeliveryRequest"("bookingRequestId");
