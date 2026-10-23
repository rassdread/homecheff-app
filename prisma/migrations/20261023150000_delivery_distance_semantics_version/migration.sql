-- Versioned delivery distance semantics.
-- NULL keeps legacy matching. 1 is distance model A.
-- Nullable, no default, and no backfill of existing profiles.
ALTER TABLE "DeliveryProfile"
ADD COLUMN "distanceSemanticsVersion" INTEGER;
