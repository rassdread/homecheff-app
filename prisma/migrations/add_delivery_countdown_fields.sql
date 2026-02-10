-- Add countdown timer fields to DeliveryOrder
ALTER TABLE "DeliveryOrder" 
ADD COLUMN IF NOT EXISTS "deliveryDeadline" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "countdownStartedAt" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "countdownWarningsSent" JSONB,
ADD COLUMN IF NOT EXISTS "actualDeliveryTime" INTEGER;

-- Add order related fields to Notification
ALTER TABLE "Notification"
ADD COLUMN IF NOT EXISTS "orderId" TEXT,
ADD COLUMN IF NOT EXISTS "deliveryOrderId" TEXT,
ADD COLUMN IF NOT EXISTS "countdownData" JSONB;

-- Create indexes
CREATE INDEX IF NOT EXISTS "Notification_orderId_idx" ON "Notification"("orderId");
CREATE INDEX IF NOT EXISTS "Notification_deliveryOrderId_idx" ON "Notification"("deliveryOrderId");


