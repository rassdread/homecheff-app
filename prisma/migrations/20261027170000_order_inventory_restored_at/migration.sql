-- One-time marker so a full refund of an unfulfilled order restores stock once.
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "inventoryRestoredAt" TIMESTAMP(3);
