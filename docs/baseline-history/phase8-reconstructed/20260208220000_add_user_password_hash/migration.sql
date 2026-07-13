-- Baseline pack (Phase 8): idempotent reconstruction — not byte-identical to original checksum.
-- Safe on shared Neon where column already exists.

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordHash" TEXT;
