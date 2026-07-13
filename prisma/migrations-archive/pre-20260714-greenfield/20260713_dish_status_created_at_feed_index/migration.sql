-- Baseline migration: Dish feed index (status, createdAt DESC)
-- Index may already exist on shared Neon (manual CONCURRENTLY, Phase 3D).
-- Idempotent: safe on fresh DBs and environments where the index is already present.

CREATE INDEX IF NOT EXISTS "Dish_status_createdAt_idx"
  ON "Dish" ("status", "createdAt" DESC);
