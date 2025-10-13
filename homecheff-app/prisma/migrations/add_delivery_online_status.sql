-- Add isOnline and GPS tracking fields to DeliveryProfile
ALTER TABLE "DeliveryProfile" 
ADD COLUMN IF NOT EXISTS "isOnline" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "lastOnlineAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "lastOfflineAt" TIMESTAMP(3);

-- Add lastLocationUpdate to User for GPS tracking
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "lastLocationUpdate" TIMESTAMP(3);

-- Create index for faster online deliverer queries
CREATE INDEX IF NOT EXISTS "DeliveryProfile_isOnline_idx" ON "DeliveryProfile"("isOnline");
CREATE INDEX IF NOT EXISTS "DeliveryProfile_currentLat_currentLng_idx" ON "DeliveryProfile"("currentLat", "currentLng");

-- Update existing delivery profiles to have currentLat/currentLng from user profile if available
UPDATE "DeliveryProfile" dp
SET 
  "currentLat" = u.lat,
  "currentLng" = u.lng,
  "lastLocationUpdate" = NOW()
FROM "User" u
WHERE dp."userId" = u.id
  AND u.lat IS NOT NULL 
  AND u.lng IS NOT NULL
  AND dp."currentLat" IS NULL;

