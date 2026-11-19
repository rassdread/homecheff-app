-- Last retrieved Connect capability flags. Null means the check was not stored.
ALTER TABLE "User" ADD COLUMN "stripeChargesEnabled" BOOLEAN;
ALTER TABLE "User" ADD COLUMN "stripePayoutsEnabled" BOOLEAN;
ALTER TABLE "User" ADD COLUMN "stripeTransfersStatus" TEXT;
ALTER TABLE "User" ADD COLUMN "stripeCapabilityCheckedAt" TIMESTAMP(3);
