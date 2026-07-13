-- Baseline pack (Phase 8): SUPERADMIN enum value on UserRole.
-- Idempotent; safe if value already exists.

ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SUPERADMIN';
