-- HCP V3: persisted automatic rewards (no payouts).
CREATE TYPE "HcpRewardStatus" AS ENUM ('ACTIVE', 'EXPIRED');

CREATE TABLE "UserHcpReward" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "HcpRewardStatus" NOT NULL DEFAULT 'ACTIVE',
    "grantedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserHcpReward_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserHcpReward_userId_slug_key" ON "UserHcpReward"("userId", "slug");
CREATE INDEX "UserHcpReward_userId_idx" ON "UserHcpReward"("userId");
CREATE INDEX "UserHcpReward_status_idx" ON "UserHcpReward"("status");

ALTER TABLE "UserHcpReward" ADD CONSTRAINT "UserHcpReward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
