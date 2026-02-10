-- Fix updatedAt column in DishReview table
-- Ensure it has a default value and is NOT NULL

-- First, check current state
SELECT column_name, data_type, column_default, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'DishReview' AND column_name = 'updatedAt';

-- Set default value if not exists
ALTER TABLE IF EXISTS "DishReview" 
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- Ensure NOT NULL constraint
ALTER TABLE IF EXISTS "DishReview" 
ALTER COLUMN "updatedAt" SET NOT NULL;

-- Update any existing NULL values
UPDATE "DishReview" 
SET "updatedAt" = COALESCE("createdAt", CURRENT_TIMESTAMP) 
WHERE "updatedAt" IS NULL;




























