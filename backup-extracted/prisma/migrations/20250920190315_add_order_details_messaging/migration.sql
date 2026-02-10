-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."MessageType" ADD VALUE 'ORDER_STATUS_UPDATE';
ALTER TYPE "public"."MessageType" ADD VALUE 'ORDER_PICKUP_INFO';
ALTER TYPE "public"."MessageType" ADD VALUE 'ORDER_DELIVERY_INFO';
ALTER TYPE "public"."MessageType" ADD VALUE 'ORDER_ADDRESS_UPDATE';

-- AlterTable
ALTER TABLE "public"."Order" ADD COLUMN     "deliveryAddress" TEXT,
ADD COLUMN     "deliveryDate" TIMESTAMP(3),
ADD COLUMN     "deliveryMode" "public"."DeliveryMode" NOT NULL DEFAULT 'PICKUP',
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "pickupAddress" TEXT,
ADD COLUMN     "pickupDate" TIMESTAMP(3);
