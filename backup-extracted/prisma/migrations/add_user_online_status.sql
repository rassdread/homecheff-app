-- Add online status fields to User table
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "isOnline" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "lastSeenAt" TIMESTAMP(3);

-- Create index for faster online user queries
CREATE INDEX IF NOT EXISTS "User_isOnline_idx" ON "User"("isOnline");
CREATE INDEX IF NOT EXISTS "User_lastSeenAt_idx" ON "User"("lastSeenAt");

-- Update existing users to have lastSeenAt set to their createdAt
UPDATE "User" 
SET "lastSeenAt" = "createdAt" 
WHERE "lastSeenAt" IS NULL;
