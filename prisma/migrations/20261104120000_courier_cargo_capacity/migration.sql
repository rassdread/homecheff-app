-- Nullable cargo limits for existing courier profiles.
-- No defaults and no backfill. Existing rows stay NULL and remain
-- matchable for marketplace orders that do not carry an explicit shipment.
ALTER TABLE "DeliveryProfile" ADD COLUMN "maxWeightGrams" INTEGER;
ALTER TABLE "DeliveryProfile" ADD COLUMN "maxLengthCm" INTEGER;
ALTER TABLE "DeliveryProfile" ADD COLUMN "maxWidthCm" INTEGER;
ALTER TABLE "DeliveryProfile" ADD COLUMN "maxHeightCm" INTEGER;
ALTER TABLE "DeliveryProfile" ADD COLUMN "maxPackageCount" INTEGER;
ALTER TABLE "DeliveryProfile" ADD COLUMN "carriesFragile" BOOLEAN;
ALTER TABLE "DeliveryProfile" ADD COLUMN "temperatureControlled" BOOLEAN;
ALTER TABLE "DeliveryProfile" ADD COLUMN "liftAssistance" BOOLEAN;
