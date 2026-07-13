-- Allow delivery orders to be created before a deliverer is assigned
ALTER TABLE "DeliveryOrder"
  ALTER COLUMN "deliveryProfileId" DROP NOT NULL;





