-- Temporary online override expiry. Does not change scheduled availability.
ALTER TABLE "DeliveryProfile" ADD COLUMN IF NOT EXISTS "onlineUntil" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "DeliveryProfile_onlineUntil_idx" ON "DeliveryProfile"("onlineUntil");
