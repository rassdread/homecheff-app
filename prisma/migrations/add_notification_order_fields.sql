-- Add orderId and deliveryOrderId columns to Notification table
-- These columns are optional and data is also stored in payload JSON

ALTER TABLE "Notification" 
ADD COLUMN IF NOT EXISTS "orderId" TEXT,
ADD COLUMN IF NOT EXISTS "deliveryOrderId" TEXT;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS "Notification_orderId_idx" ON "Notification"("orderId");
CREATE INDEX IF NOT EXISTS "Notification_deliveryOrderId_idx" ON "Notification"("deliveryOrderId");


