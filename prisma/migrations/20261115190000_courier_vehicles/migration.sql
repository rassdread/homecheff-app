-- One row per vehicle. Older profiles keep their coarse transportation list.
-- A single stored measurement set is copied onto the only vehicle.
-- Several vehicles keep that set unassigned until the courier chooses one.
-- Production stores centimetres on maxLengthCm/maxWidthCm/maxHeightCm and weight in grams.

ALTER TABLE "DeliveryProfile" ADD COLUMN IF NOT EXISTS "legacyCapacityUnassigned" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "DeliveryBookingRequest" ADD COLUMN IF NOT EXISTS "matchedVehicleId" TEXT;
ALTER TABLE "StandaloneDeliveryRequest" ADD COLUMN IF NOT EXISTS "matchedVehicleId" TEXT;

CREATE TABLE IF NOT EXISTS "DeliveryVehicle" (
  "id" TEXT NOT NULL,
  "deliveryProfileId" TEXT NOT NULL,
  "family" TEXT NOT NULL,
  "variant" TEXT,
  "carrying" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "carryingProvider" TEXT,
  "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "maxLengthCm" INTEGER,
  "maxWidthCm" INTEGER,
  "maxHeightCm" INTEGER,
  "maxWeightKg" INTEGER,
  "capacityStatus" JSONB,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DeliveryVehicle_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "DeliveryVehicle_deliveryProfileId_idx" ON "DeliveryVehicle"("deliveryProfileId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'DeliveryVehicle_deliveryProfileId_fkey'
  ) THEN
    ALTER TABLE "DeliveryVehicle"
      ADD CONSTRAINT "DeliveryVehicle_deliveryProfileId_fkey"
      FOREIGN KEY ("deliveryProfileId") REFERENCES "DeliveryProfile"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

INSERT INTO "DeliveryVehicle" (
  "id",
  "deliveryProfileId",
  "family",
  "variant",
  "carrying",
  "features",
  "maxLengthCm",
  "maxWidthCm",
  "maxHeightCm",
  "maxWeightKg",
  "capacityStatus",
  "sortOrder",
  "createdAt",
  "updatedAt"
)
SELECT
  md5(p."id" || ':' || t.mode || ':' || t.ord::text),
  p."id",
  CASE t.mode
    WHEN 'EBIKE' THEN 'EBIKE'
    WHEN 'SCOOTER' THEN 'SCOOTER'
    WHEN 'CAR' THEN 'CAR'
    WHEN 'ESTATE' THEN 'CAR'
    WHEN 'VAN' THEN 'BUS'
    WHEN 'BOX_TRUCK' THEN 'BUS'
    WHEN 'TRAILER' THEN 'TRAILER'
    ELSE 'BIKE'
  END,
  CASE t.mode
    WHEN 'ESTATE' THEN 'STATION'
    WHEN 'BOX_TRUCK' THEN 'MOVING'
    ELSE NULL
  END,
  ARRAY[]::TEXT[],
  ARRAY[]::TEXT[],
  CASE WHEN cardinality(p."transportation") = 1
    AND (
      COALESCE(p."vehicleCapacityStatus"->>'length', '') = 'set'
      OR (p."vehicleCapacityStatus" IS NULL AND p."maxLengthCm" IS NOT NULL)
    )
    THEN p."maxLengthCm" ELSE NULL END,
  CASE WHEN cardinality(p."transportation") = 1
    AND (
      COALESCE(p."vehicleCapacityStatus"->>'width', '') = 'set'
      OR (p."vehicleCapacityStatus" IS NULL AND p."maxWidthCm" IS NOT NULL)
    )
    THEN p."maxWidthCm" ELSE NULL END,
  CASE WHEN cardinality(p."transportation") = 1
    AND (
      COALESCE(p."vehicleCapacityStatus"->>'height', '') = 'set'
      OR (p."vehicleCapacityStatus" IS NULL AND p."maxHeightCm" IS NOT NULL)
    )
    THEN p."maxHeightCm" ELSE NULL END,
  CASE WHEN cardinality(p."transportation") = 1
    AND (
      COALESCE(p."vehicleCapacityStatus"->>'weight', '') = 'set'
      OR (p."vehicleCapacityStatus" IS NULL AND p."maxWeightGrams" IS NOT NULL)
    )
    THEN ROUND(p."maxWeightGrams" / 1000.0)::int ELSE NULL END,
  CASE WHEN cardinality(p."transportation") = 1 THEN p."vehicleCapacityStatus" ELSE NULL END,
  (t.ord - 1)::int,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "DeliveryProfile" p
CROSS JOIN LATERAL unnest(p."transportation") WITH ORDINALITY AS t(mode, ord)
WHERE cardinality(p."transportation") > 0
  AND NOT EXISTS (
    SELECT 1 FROM "DeliveryVehicle" v WHERE v."deliveryProfileId" = p."id"
  );

UPDATE "DeliveryProfile" p
SET "legacyCapacityUnassigned" = true
WHERE cardinality(p."transportation") > 1
  AND (
    COALESCE(p."vehicleCapacityStatus"->>'length', '') = 'set'
    OR COALESCE(p."vehicleCapacityStatus"->>'width', '') = 'set'
    OR COALESCE(p."vehicleCapacityStatus"->>'height', '') = 'set'
    OR COALESCE(p."vehicleCapacityStatus"->>'weight', '') = 'set'
    OR (
      p."vehicleCapacityStatus" IS NULL
      AND (
        p."maxLengthCm" IS NOT NULL
        OR p."maxWidthCm" IS NOT NULL
        OR p."maxHeightCm" IS NOT NULL
        OR p."maxWeightGrams" IS NOT NULL
      )
    )
  );
