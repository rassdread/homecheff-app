-- Fix updatedAt column to have default value for inserts
-- This ensures updatedAt is set on create, and @updatedAt handles updates
ALTER TABLE IF EXISTS "public"."DishReview" 
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- Ensure the column is NOT NULL (should already be, but making sure)
ALTER TABLE IF EXISTS "public"."DishReview" 
ALTER COLUMN "updatedAt" SET NOT NULL;




























