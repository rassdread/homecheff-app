-- Courier Stripe identity classification. Document images and numbers are not stored.
ALTER TABLE "DeliveryProfile" ADD COLUMN "stripeIdentityState" TEXT;
ALTER TABLE "DeliveryProfile" ADD COLUMN "stripeIdentityReason" TEXT;
ALTER TABLE "DeliveryProfile" ADD COLUMN "stripeIdentityCheckedAt" TIMESTAMP(3);

CREATE INDEX "DeliveryProfile_stripeIdentityState_stripeIdentityCheckedAt_idx"
ON "DeliveryProfile"("stripeIdentityState", "stripeIdentityCheckedAt");
