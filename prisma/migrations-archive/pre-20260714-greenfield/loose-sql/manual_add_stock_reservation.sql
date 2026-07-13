-- Create StockReservationStatus enum
CREATE TYPE "StockReservationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'EXPIRED', 'CANCELLED');

-- Create StockReservation table
CREATE TABLE "StockReservation" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "stripeSessionId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" "StockReservationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockReservation_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on stripeSessionId
CREATE UNIQUE INDEX "StockReservation_stripeSessionId_key" ON "StockReservation"("stripeSessionId");

-- Create indexes
CREATE INDEX "StockReservation_productId_status_expiresAt_idx" ON "StockReservation"("productId", "status", "expiresAt");
CREATE INDEX "StockReservation_stripeSessionId_idx" ON "StockReservation"("stripeSessionId");
CREATE INDEX "StockReservation_expiresAt_idx" ON "StockReservation"("expiresAt");

-- Add foreign key constraint
ALTER TABLE "StockReservation" ADD CONSTRAINT "StockReservation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

































