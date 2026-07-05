-- Delivery Marketplace Foundation V1

-- CreateEnum
CREATE TYPE "DeliveryRequestStatus" AS ENUM ('OPEN', 'CLAIMED', 'ASSIGNED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "CourierWeekday" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');
CREATE TYPE "CourierVehicleType" AS ENUM ('CAR', 'BIKE', 'SCOOTER', 'WALK');
CREATE TYPE "CourierAssignmentStatus" AS ENUM ('PENDING', 'ACCEPTED', 'COMPLETED', 'CANCELLED');

-- AlterEnum NotificationType
ALTER TYPE "NotificationType" ADD VALUE 'DELIVERY_REQUEST_CREATED';
ALTER TYPE "NotificationType" ADD VALUE 'DELIVERY_REQUEST_ASSIGNED';
ALTER TYPE "NotificationType" ADD VALUE 'DELIVERY_REQUEST_ACCEPTED';
ALTER TYPE "NotificationType" ADD VALUE 'DELIVERY_REQUEST_COMPLETED';

-- CreateTable DeliveryRequest
CREATE TABLE "DeliveryRequest" (
    "id" TEXT NOT NULL,
    "communityOrderId" TEXT NOT NULL,
    "status" "DeliveryRequestStatus" NOT NULL DEFAULT 'OPEN',
    "pickupAddress" TEXT,
    "deliveryAddress" TEXT,
    "pickupDate" TIMESTAMP(3),
    "pickupTimeWindow" TEXT,
    "deliveryDate" TIMESTAMP(3),
    "deliveryTimeWindow" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable CourierAvailability
CREATE TABLE "CourierAvailability" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekday" "CourierWeekday" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "radiusKm" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "preferredAreas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "vehicleType" "CourierVehicleType" NOT NULL DEFAULT 'BIKE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourierAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable CourierAssignment
CREATE TABLE "CourierAssignment" (
    "id" TEXT NOT NULL,
    "deliveryRequestId" TEXT NOT NULL,
    "courierId" TEXT NOT NULL,
    "status" "CourierAssignmentStatus" NOT NULL DEFAULT 'PENDING',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourierAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeliveryRequest_communityOrderId_idx" ON "DeliveryRequest"("communityOrderId");
CREATE INDEX "DeliveryRequest_status_idx" ON "DeliveryRequest"("status");
CREATE INDEX "CourierAvailability_userId_isActive_idx" ON "CourierAvailability"("userId", "isActive");
CREATE INDEX "CourierAvailability_weekday_idx" ON "CourierAvailability"("weekday");
CREATE INDEX "CourierAssignment_deliveryRequestId_status_idx" ON "CourierAssignment"("deliveryRequestId", "status");
CREATE INDEX "CourierAssignment_courierId_status_idx" ON "CourierAssignment"("courierId", "status");

-- AddForeignKey
ALTER TABLE "DeliveryRequest" ADD CONSTRAINT "DeliveryRequest_communityOrderId_fkey" FOREIGN KEY ("communityOrderId") REFERENCES "CommunityOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CourierAvailability" ADD CONSTRAINT "CourierAvailability_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CourierAssignment" ADD CONSTRAINT "CourierAssignment_deliveryRequestId_fkey" FOREIGN KEY ("deliveryRequestId") REFERENCES "DeliveryRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CourierAssignment" ADD CONSTRAINT "CourierAssignment_courierId_fkey" FOREIGN KEY ("courierId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
