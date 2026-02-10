-- Migration: Make reservationId optional in Transaction table
-- This migration preserves all existing data

-- Step 1: Drop the foreign key constraint (we'll recreate it as optional)
ALTER TABLE "public"."Transaction" 
DROP CONSTRAINT IF EXISTS "Transaction_reservationId_fkey";

-- Step 2: Drop the unique constraint on reservationId (we'll recreate it as nullable unique)
ALTER TABLE "public"."Transaction" 
DROP CONSTRAINT IF EXISTS "Transaction_reservationId_key";

-- Step 3: Make reservationId nullable
-- This preserves all existing data - existing reservationId values remain unchanged
ALTER TABLE "public"."Transaction" 
ALTER COLUMN "reservationId" DROP NOT NULL;

-- Step 4: Recreate the unique constraint (allows NULL values)
-- PostgreSQL allows multiple NULL values in a unique constraint
ALTER TABLE "public"."Transaction" 
ADD CONSTRAINT "Transaction_reservationId_key" UNIQUE ("reservationId");

-- Step 5: Recreate the foreign key constraint (now optional - ON DELETE SET NULL)
-- This allows transactions without reservations (for direct orders)
ALTER TABLE "public"."Transaction" 
ADD CONSTRAINT "Transaction_reservationId_fkey" 
FOREIGN KEY ("reservationId") 
REFERENCES "public"."Reservation"("id") 
ON DELETE SET NULL 
ON UPDATE CASCADE;





