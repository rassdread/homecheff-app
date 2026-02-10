-- Fix updatedAt column to ensure it has a default value
-- This script ensures the column has both a default and is NOT NULL
ALTER TABLE IF EXISTS "public"."DishReview" 
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- Verify the column is NOT NULL
ALTER TABLE IF EXISTS "public"."DishReview" 
ALTER COLUMN "updatedAt" SET NOT NULL;




























