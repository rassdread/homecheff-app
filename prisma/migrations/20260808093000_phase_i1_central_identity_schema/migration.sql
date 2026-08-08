-- Phase I.1 HomeCheff additive schema (APPLY ONLY in HomeCheff repo after explicit I.1 GO)
-- HomeCheff DB — AuthIdentityLink + SsoAuthorizationCode + SsoAuditEvent
-- Existing User remains canonical. No DROP / DELETE / TRUNCATE / SET NOT NULL.

-- Link table: product-local identity → central User
CREATE TABLE IF NOT EXISTS "AuthIdentityLink" (
  "id" TEXT NOT NULL,
  "centralUserId" TEXT NOT NULL,
  "sourceSystem" TEXT NOT NULL,
  "sourceUserId" TEXT NOT NULL,
  "sourceEmailNormalized" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'linked',
  "conflictCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuthIdentityLink_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AuthIdentityLink_sourceSystem_sourceUserId_key"
  ON "AuthIdentityLink"("sourceSystem", "sourceUserId");
CREATE INDEX IF NOT EXISTS "AuthIdentityLink_centralUserId_idx"
  ON "AuthIdentityLink"("centralUserId");
CREATE INDEX IF NOT EXISTS "AuthIdentityLink_sourceEmailNormalized_idx"
  ON "AuthIdentityLink"("sourceEmailNormalized");
CREATE INDEX IF NOT EXISTS "AuthIdentityLink_status_idx"
  ON "AuthIdentityLink"("status");

-- Optional FK within HomeCheff DB only (central User.id is UUID text)
-- ALTER TABLE "AuthIdentityLink" ADD CONSTRAINT "AuthIdentityLink_centralUserId_fkey"
--   FOREIGN KEY ("centralUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- One-time SSO authorization codes (store HASH only)
CREATE TABLE IF NOT EXISTS "SsoAuthorizationCode" (
  "id" TEXT NOT NULL,
  "codeHash" TEXT NOT NULL,
  "centralUserId" TEXT NOT NULL,
  "product" TEXT NOT NULL,
  "redirectUri" TEXT NOT NULL,
  "codeChallenge" TEXT,
  "codeChallengeMethod" TEXT,
  "state" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SsoAuthorizationCode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SsoAuthorizationCode_codeHash_key"
  ON "SsoAuthorizationCode"("codeHash");
CREATE INDEX IF NOT EXISTS "SsoAuthorizationCode_expiresAt_idx"
  ON "SsoAuthorizationCode"("expiresAt");
CREATE INDEX IF NOT EXISTS "SsoAuthorizationCode_centralUserId_product_idx"
  ON "SsoAuthorizationCode"("centralUserId", "product");

-- Identity/SSO audit (not sales activity)
CREATE TABLE IF NOT EXISTS "SsoAuditEvent" (
  "id" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "product" TEXT,
  "centralUserId" TEXT,
  "codeId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SsoAuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SsoAuditEvent_action_createdAt_idx"
  ON "SsoAuditEvent"("action", "createdAt");
CREATE INDEX IF NOT EXISTS "SsoAuditEvent_centralUserId_createdAt_idx"
  ON "SsoAuditEvent"("centralUserId", "createdAt");
