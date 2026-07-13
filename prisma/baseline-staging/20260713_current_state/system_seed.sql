-- HomeCheff Phase 9 — optional system seed (STAGING)
-- Apply ONLY after schema_baseline.sql on disposable greenfield databases.
-- NOT for shared Neon. NOT production user data.

-- ---------------------------------------------------------------------------
-- Unassigned delivery sentinel — OPTIONAL (default: omitted in greenfield)
-- Phase 7: app uses deliveryProfileId = NULL; sentinel is legacy on shared Neon.
-- Uncomment block below only when testing historical compatibility.
-- ---------------------------------------------------------------------------

/*
INSERT INTO "User" ("id", "email", "createdAt", "updatedAt", "role")
VALUES (
  'system-unassigned-delivery',
  'system+unassigned@homecheff.internal',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  'USER'::"UserRole"
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "DeliveryProfile" (
  "id", "userId", "age", "isActive", "isVerified", "maxDistance",
  "totalDeliveries", "totalEarnings", "deliveryMode", "gpsTrackingEnabled",
  "isOnline", "createdAt", "updatedAt"
)
VALUES (
  'unassigned', 'system-unassigned-delivery', 0, false, false, 3.0,
  0, 0, 'FIXED', false, false,
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;
*/

-- No default rows required for: Badge (upsert on unlock), HcpCarouselSlide (admin-created),
-- PromoCode, Product, User accounts, or taxonomy configuration.
