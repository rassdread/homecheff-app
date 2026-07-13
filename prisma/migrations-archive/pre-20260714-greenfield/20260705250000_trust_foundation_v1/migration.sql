-- Trust Foundation V1: deal completion, deal reviews, community delivery reviews

ALTER TABLE "CommunityOrder" ADD COLUMN "completedAt" TIMESTAMP(3);
ALTER TABLE "CommunityOrder" ADD COLUMN "cancelledAt" TIMESTAMP(3);

CREATE TABLE "DealReview" (
    "id" TEXT NOT NULL,
    "communityOrderId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "revieweeId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealReview_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DealReview_communityOrderId_reviewerId_key" ON "DealReview"("communityOrderId", "reviewerId");
CREATE INDEX "DealReview_revieweeId_idx" ON "DealReview"("revieweeId");
CREATE INDEX "DealReview_communityOrderId_idx" ON "DealReview"("communityOrderId");

ALTER TABLE "DealReview" ADD CONSTRAINT "DealReview_communityOrderId_fkey" FOREIGN KEY ("communityOrderId") REFERENCES "CommunityOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DealReview" ADD CONSTRAINT "DealReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DealReview" ADD CONSTRAINT "DealReview_revieweeId_fkey" FOREIGN KEY ("revieweeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DeliveryReview" ADD COLUMN "courierAssignmentId" TEXT;
ALTER TABLE "DeliveryReview" ADD COLUMN "deliveryRequestId" TEXT;
ALTER TABLE "DeliveryReview" ADD COLUMN "communityOrderId" TEXT;

CREATE UNIQUE INDEX "DeliveryReview_courierAssignmentId_reviewerId_key" ON "DeliveryReview"("courierAssignmentId", "reviewerId");
CREATE INDEX "DeliveryReview_communityOrderId_idx" ON "DeliveryReview"("communityOrderId");

ALTER TABLE "DeliveryReview" ADD CONSTRAINT "DeliveryReview_courierAssignmentId_fkey" FOREIGN KEY ("courierAssignmentId") REFERENCES "CourierAssignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
