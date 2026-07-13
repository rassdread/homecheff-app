-- Add socialOnboardingCompleted field to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "socialOnboardingCompleted" BOOLEAN NOT NULL DEFAULT true;

-- Set existing users to completed
UPDATE "User" SET "socialOnboardingCompleted" = true WHERE "socialOnboardingCompleted" IS NULL;

-- Users with temp_ usernames need onboarding
UPDATE "User" SET "socialOnboardingCompleted" = false WHERE "username" LIKE 'temp_%';

