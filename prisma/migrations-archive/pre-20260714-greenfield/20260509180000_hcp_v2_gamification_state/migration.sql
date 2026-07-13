-- HCP V2: onboarding + client reward queue + weekly challenges JSON
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "hcpWelcomeSeenAt" TIMESTAMP(3);

ALTER TABLE "UserHcpStats" ADD COLUMN IF NOT EXISTS "pendingClientRewards" JSONB;
ALTER TABLE "UserHcpStats" ADD COLUMN IF NOT EXISTS "weeklyChallengesJson" JSONB;
