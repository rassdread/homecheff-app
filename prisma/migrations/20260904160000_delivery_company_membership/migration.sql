-- Delivery company membership, invites, driver assignment (individual + company product)

ALTER TABLE "DeliveryProfile"
  ADD COLUMN IF NOT EXISTS "companyDisplayName" TEXT,
  ADD COLUMN IF NOT EXISTS "companyLogoUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "companyDescription" TEXT;

ALTER TABLE "DeliveryOrder"
  ADD COLUMN IF NOT EXISTS "assignedDriverUserId" TEXT,
  ADD COLUMN IF NOT EXISTS "assignedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "assignedByUserId" TEXT;

CREATE INDEX IF NOT EXISTS "DeliveryOrder_assignedDriverUserId_idx"
  ON "DeliveryOrder"("assignedDriverUserId");

DO $$ BEGIN
  CREATE TYPE "DeliveryCompanyMemberRole" AS ENUM ('OWNER', 'DISPATCHER', 'DRIVER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "DeliveryCompanyMemberStatus" AS ENUM ('ACTIVE', 'DISABLED', 'REMOVED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "DeliveryCompanyInviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "DeliveryCompanyMember" (
  "id" TEXT NOT NULL,
  "companyProfileId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "DeliveryCompanyMemberRole" NOT NULL,
  "status" "DeliveryCompanyMemberStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "disabledAt" TIMESTAMP(3),
  CONSTRAINT "DeliveryCompanyMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DeliveryCompanyMember_companyProfileId_userId_key"
  ON "DeliveryCompanyMember"("companyProfileId", "userId");
CREATE INDEX IF NOT EXISTS "DeliveryCompanyMember_userId_idx"
  ON "DeliveryCompanyMember"("userId");
CREATE INDEX IF NOT EXISTS "DeliveryCompanyMember_companyProfileId_status_idx"
  ON "DeliveryCompanyMember"("companyProfileId", "status");

CREATE TABLE IF NOT EXISTS "DeliveryCompanyInvite" (
  "id" TEXT NOT NULL,
  "companyProfileId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "role" "DeliveryCompanyMemberRole" NOT NULL DEFAULT 'DRIVER',
  "status" "DeliveryCompanyInviteStatus" NOT NULL DEFAULT 'PENDING',
  "tokenHash" TEXT NOT NULL,
  "invitedByUserId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "acceptedUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DeliveryCompanyInvite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DeliveryCompanyInvite_tokenHash_key"
  ON "DeliveryCompanyInvite"("tokenHash");
CREATE INDEX IF NOT EXISTS "DeliveryCompanyInvite_companyProfileId_status_idx"
  ON "DeliveryCompanyInvite"("companyProfileId", "status");
CREATE INDEX IF NOT EXISTS "DeliveryCompanyInvite_email_idx"
  ON "DeliveryCompanyInvite"("email");

CREATE TABLE IF NOT EXISTS "DeliveryDriverAssignmentEvent" (
  "id" TEXT NOT NULL,
  "deliveryOrderId" TEXT NOT NULL,
  "companyProfileId" TEXT NOT NULL,
  "fromDriverUserId" TEXT,
  "toDriverUserId" TEXT,
  "actorUserId" TEXT NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DeliveryDriverAssignmentEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "DeliveryDriverAssignmentEvent_deliveryOrderId_idx"
  ON "DeliveryDriverAssignmentEvent"("deliveryOrderId");
CREATE INDEX IF NOT EXISTS "DeliveryDriverAssignmentEvent_companyProfileId_idx"
  ON "DeliveryDriverAssignmentEvent"("companyProfileId");

DO $$ BEGIN
  ALTER TABLE "DeliveryCompanyMember"
    ADD CONSTRAINT "DeliveryCompanyMember_companyProfileId_fkey"
    FOREIGN KEY ("companyProfileId") REFERENCES "DeliveryProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "DeliveryCompanyMember"
    ADD CONSTRAINT "DeliveryCompanyMember_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "DeliveryCompanyInvite"
    ADD CONSTRAINT "DeliveryCompanyInvite_companyProfileId_fkey"
    FOREIGN KEY ("companyProfileId") REFERENCES "DeliveryProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "DeliveryCompanyInvite"
    ADD CONSTRAINT "DeliveryCompanyInvite_invitedByUserId_fkey"
    FOREIGN KEY ("invitedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "DeliveryDriverAssignmentEvent"
    ADD CONSTRAINT "DeliveryDriverAssignmentEvent_companyProfileId_fkey"
    FOREIGN KEY ("companyProfileId") REFERENCES "DeliveryProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "DeliveryDriverAssignmentEvent"
    ADD CONSTRAINT "DeliveryDriverAssignmentEvent_actorUserId_fkey"
    FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "DeliveryDriverAssignmentEvent"
    ADD CONSTRAINT "DeliveryDriverAssignmentEvent_fromDriverUserId_fkey"
    FOREIGN KEY ("fromDriverUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "DeliveryDriverAssignmentEvent"
    ADD CONSTRAINT "DeliveryDriverAssignmentEvent_toDriverUserId_fkey"
    FOREIGN KEY ("toDriverUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "DeliveryOrder"
    ADD CONSTRAINT "DeliveryOrder_assignedDriverUserId_fkey"
    FOREIGN KEY ("assignedDriverUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
