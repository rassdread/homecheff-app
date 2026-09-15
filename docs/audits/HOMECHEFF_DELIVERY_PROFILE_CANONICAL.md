# Canonical DeliveryProfile source of truth

**Canonical row:** `DeliveryProfile` (not `User`, not `CourierAvailability`, not client state).

`User.lat/lng/place` is a **fallback origin** until `homeLat/homeLng` is written. Matching already used that fallback (`resolveDelivererPosition`); completeness now uses the same resolver via `getDeliveryProfileCompletionFromRow`.

## Fields

| Concern | Canonical fields |
|---|---|
| Active | `isActive`, `isOnline`, `temporaryOffline` |
| Area | `homeLat`, `homeLng`, `homeAddress`, `maxDistance`, `preferredRadius`, `nationalCoverage`, `deliveryMode` |
| Availability | `availableDays` (nl weekdays), `availableTimeSlots` (`morning`/`afternoon`/`evening`), `workStartTime`, `workEndTime` (`HH:mm`) |
| Pricing | `pricingEnabled`, `baseFeeCents`, `pricePerKmCents`, `minimumFeeCents`, `freeDeliveryRadiusKm`, `currency` (cents integers; euros only in UI) |
| Completeness | Derived: `getDeliveryProfileCompletion()` — not a stored boolean |

## Completeness (`getDeliveryProfileCompletion`)

Required:

1. Service area: `nationalCoverage` **or** (coords + `maxDistance > 0`). Coords = `homeLat/homeLng` or User fallback.
2. Availability: at least one day **and** (slots **or** work start+end).
3. Pricing: `pricingEnabled` + integer cents (when provider pricing flag is on).
4. Business: `companyDisplayName` when `providerType = DELIVERY_BUSINESS`.

Used by: Delivery Settings, delivery dashboard (`/api/delivery/activate`), sidebar/action-center, Mijn HomeCheff readiness, onboarding CTAs.

Editor: `/delivery/settings`. Legacy `/delivery/instellingen` redirects here.

## Write path

`PUT /api/delivery/settings` merges onto the existing row (Prisma `undefined` = skip). Partial updates must not null other fields. `preferredRadius` and `deliveryMode` are persisted. Home coords are persisted (and backfilled from User when missing).
