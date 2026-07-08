# UX Finalization — Phase 7D — Marketplace Architecture

Date: 2026-07-08
Status: ✅ Complete

## Goal

Lock in one canonical marketplace architecture (Intent / Category / Settlement),
one universal tile standard, and one shared data model across all surfaces —
without redesign, new backend, or performance regression.

## Delivered

| Item | Status | Notes |
|------|--------|-------|
| 7D.1 Canonical model | ✅ | `lib/marketplace/canonical-model.ts` — 3 axes frozen |
| 7D.2 Discovery filters | ✅ | VIEW (All/Offered/Wanted/Inspiration) + CATEGORY (Food/Garden/Creations/Services); mapped to existing chips |
| 7D.3 Filtering rules | ✅ | Offered covers all value forms; settlement never filters (verified live) |
| 7D.4 Universal tile | ✅ | badge · maker/location · title · price+accepted · settlement · trust |
| 7D.5 Accepted Values | ✅ | taxonomy-only via `build-tile-accepted-value-icons`, next to price |
| 7D.6 Settlement row | ✅ | `build-tile-settlement-row`, always at bottom, distinct icons |
| 7D.7 Category badge | ✅ | one primary badge (listing_kind deduped) |
| 7D.8 Tile consistency | ✅ | Router/Standard/Compact/Mini/Preview/Profile/Favorites share primitives |
| 7D.9 Data integrity | ✅ | axes derive from existing single-source helpers, no parallel table |
| 7D.10 Performance | ✅ | no fetch/effect/prisma in canonical model |
| 7D.11 Validator | ✅ | `scripts/validate-marketplace-architecture-phase7d.ts` |

## Files

- **New**: `lib/marketplace/canonical-model.ts`
- **New**: `scripts/validate-marketplace-architecture-phase7d.ts`
- **New**: `docs/audits/MARKETPLACE_ARCHITECTURE_PHASE7D_AUDIT.md`
- **i18n**: `public/i18n/{nl,en}.json` — `marketplace.canonical.view.*` + `marketplace.canonical.category.*`

## Key decisions

- **Services is a category, not an intent.** The canonical model enforces this; the
  legacy `'services'` feed chip is documented as a category surfaced inside Offered
  (a service is always `isMarketplaceSaleItem === true`).
- **4 canonical categories collapse the existing 6-vertical registry** — derived via
  `marketplaceCategoryToMainCategory`, no second truth.
- **No UI rewire.** The model maps onto existing chips, tiles, and settlement helpers.

## Deferred

- Migrating the `'services'` VIEW chip into a real CATEGORY-axis control (UI rewire).
- Dedicated "Related items" surface (currently served by profile grid / feed tiles).

## Validation

- `npx tsx scripts/validate-marketplace-architecture-phase7d.ts`
- `npx tsx scripts/validate-settlement-options-phase7c.ts`
- `npx tsx scripts/validate-marketplace-tile-payment-semantics-phase7b.ts`
- `npx tsx scripts/validate-first-run-clarity-phase7a.ts`
- `npm run build`
