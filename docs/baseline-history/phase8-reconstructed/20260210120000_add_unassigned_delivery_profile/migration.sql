-- Baseline pack (Phase 8): sentinel system user + inactive delivery profile (Phase 7 evidence).
-- Data migration only. Application uses deliveryProfileId NULL for unassigned orders.
-- Idempotent: safe on shared Neon where records already exist.

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
  "id",
  "userId",
  "age",
  "isActive",
  "isVerified",
  "maxDistance",
  "totalDeliveries",
  "totalEarnings",
  "deliveryMode",
  "gpsTrackingEnabled",
  "isOnline",
  "createdAt",
  "updatedAt"
)
VALUES (
  'unassigned',
  'system-unassigned-delivery',
  0,
  false,
  false,
  3.0,
  0,
  0,
  'FIXED',
  false,
  false,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;
