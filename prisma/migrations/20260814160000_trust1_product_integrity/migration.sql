-- TRUST-1: Product integrity moderation + community reports (additive only).
-- No backfill of contribution/provenance. Legacy products remain integrityStatus=ACTIVE.

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "integrityStatus" TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "integrityHiddenAt" TIMESTAMP(3);
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "integrityHiddenReason" TEXT;

CREATE INDEX IF NOT EXISTS "Product_integrityStatus_idx" ON "Product"("integrityStatus");

CREATE TABLE IF NOT EXISTS "ProductIntegrityReport" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "reporterId" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "explanation" TEXT,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "credibilityWeight" DOUBLE PRECISION NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  CONSTRAINT "ProductIntegrityReport_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ProductIntegrityReport_reporterId_productId_reason_key"
  ON "ProductIntegrityReport"("reporterId", "productId", "reason");
CREATE INDEX IF NOT EXISTS "ProductIntegrityReport_productId_status_createdAt_idx"
  ON "ProductIntegrityReport"("productId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "ProductIntegrityReport_status_createdAt_idx"
  ON "ProductIntegrityReport"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "ProductIntegrityReport_reporterId_createdAt_idx"
  ON "ProductIntegrityReport"("reporterId", "createdAt");

DO $$ BEGIN
  ALTER TABLE "ProductIntegrityReport"
    ADD CONSTRAINT "ProductIntegrityReport_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ProductIntegrityReport"
    ADD CONSTRAINT "ProductIntegrityReport_reporterId_fkey"
    FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "ProductIntegrityAction" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "actorUserId" TEXT,
  "action" TEXT NOT NULL,
  "note" TEXT,
  "meta" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductIntegrityAction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ProductIntegrityAction_productId_createdAt_idx"
  ON "ProductIntegrityAction"("productId", "createdAt");
CREATE INDEX IF NOT EXISTS "ProductIntegrityAction_action_createdAt_idx"
  ON "ProductIntegrityAction"("action", "createdAt");

DO $$ BEGIN
  ALTER TABLE "ProductIntegrityAction"
    ADD CONSTRAINT "ProductIntegrityAction_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ProductIntegrityAction"
    ADD CONSTRAINT "ProductIntegrityAction_actorUserId_fkey"
    FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
