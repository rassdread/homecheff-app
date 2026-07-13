-- Phase 3D — Dish feed index (PROPOSAL ONLY — do not run on production without review)
-- Prisma migration name: dish_status_created_at_feed_index

-- Development / preview (blocking OK on small tables):
-- CREATE INDEX "Dish_status_createdAt_idx" ON "Dish" ("status", "createdAt" DESC);

-- Production (preferred — non-blocking):
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Dish_status_createdAt_idx"
  ON "Dish" ("status", "createdAt" DESC);

-- Rollback:
-- DROP INDEX CONCURRENTLY IF EXISTS "Dish_status_createdAt_idx";
