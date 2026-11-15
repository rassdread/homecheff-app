-- One open request per buyer, product and courier.
-- A second simultaneous renewal hits this index and reuses the stored row.
CREATE UNIQUE INDEX "DeliveryBookingRequest_one_pending_request"
ON "DeliveryBookingRequest" ("buyerId", "productId", "deliveryProfileId")
WHERE status = 'PENDING' AND "productId" IS NOT NULL;
