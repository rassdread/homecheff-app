# Marketplace Discovery Completion — Phase 10D Audit

**Date:** 2026-07-08  
**Scope:** Complete migration to canonical marketplace architecture (Phases 7A–10C). Data consistency, filter correctness, discovery quality, first-impression UX. No redesign. No new payment flows.

---

## Executive summary

Phase 10D closes the gap between **canonical architecture** (7D–10C) and **runtime behaviour** for old and new listings alike.

| Area | Verdict |
|------|---------|
| Data normalization | 10C SSOT + backfill; run before production |
| Filter persistence | **Fixed** — `discoveryDirection` + `acceptedValues` in `hc_feed_surfaces_v2` |
| Filter UI consistency | Sidebar, mobile sheet, inline GeoFeed panel aligned |
| Reverse discovery | Taxonomy scenarios verified; OR-match per value |
| Architecture | Unchanged — reuses canonical-model, settlement, taxonomy SSOT |

---

## Part 1 — Legacy data consistency audit

**SSOT:** `lib/marketplace/normalization/propose-product-normalization.ts`

Audited per Product:

| Field | Source |
|-------|--------|
| `listingIntent` | Stored + `isRequestListing()` |
| `marketplaceCategory` | Stored + legacy `category` fallback |
| `listingKind` | **Derived** via `deriveListingKind()` |
| `specializations` / `subcategory` | Taxonomy normalize |
| `acceptedSpecializations` | Accepted-values normalize |
| Settlement booleans | `resolveSettlementOptions()` |
| Fulfillment | Stored on Product |

**Issue taxonomy:** Same as Phase 10C — unmapped values become audit items, never silent overwrite.

**Run:**
```bash
npx tsx scripts/audit-marketplace-discovery-completion-phase10d.ts
npx tsx scripts/audit-marketplace-data-normalization-phase10c.ts
```

Machine-readable: `docs/audits/phase10d-discovery-completion-audit-latest.json`

---

## Part 2 — Legacy migration

**Backfill:** `scripts/backfill-marketplace-data-normalization-phase10c.ts` (idempotent, dry-run default).

Chain: `subcategory` → `specializations` → `listingKind` (derived) → `marketplaceCategory` → filter behaviour.

```bash
npx tsx scripts/backfill-marketplace-data-normalization-phase10c.ts --dry-run
CONFIRM_BACKFILL=1 npx tsx scripts/backfill-marketplace-data-normalization-phase10c.ts --write
```

Explicit new values always win. No deletes.

---

## Part 3 — Filter consistency audit

| Entry point | Canonical? | Notes |
|-------------|------------|-------|
| Desktop sidebar (`FeedSidebarFilters`) | ✅ | Direction + accepted values first-class |
| Mobile sheet (`FeedMobileFilterSheet`) | ✅ | Scope parity added in 10D |
| GeoFeed inline panel | ✅ | Matches sidebar (10D) |
| Homepage quick chips | ✅ | `DISCOVERY_VIEW_CHIP_OPTIONS` + `DISCOVERY_CATEGORY_CHIP_OPTIONS` |
| URL (`app/page.tsx`) | ✅ | `chip`, `vertical`, `place`; legacy `chip=services` migrated |
| Session (`hc_feed_surfaces_v2`) | ✅ | Extended in 10D |
| Profile filters | ⚠️ | Separate surface (`profile_v2`); uses `matchesProfileAanbodFilter` |
| Favorites | N/A | No filters |
| Search API | ✅ | `parseSearchFilterParams` + `resolveProductCategory` |
| Dorpsplein / Inspiratie | ⚠️ Deferred | Parallel stacks — separate surfaces |

**No duplicated settlement logic** in filter layer — settlement is item-level via `resolveSettlementOptions`.

---

## Part 4 — Left sidebar consistency

`HomeDesktopLeftSidebar` → `FeedFiltersPanel` → `FeedSidebarFilters`.

- Categories: `DISCOVERY_CATEGORY_CHIP_OPTIONS` (cheff/garden/designer/services)
- Legacy `chip=services` migrated on restore via `migrateHomeFilterPersist`
- USP tagline visible (10C.13)

---

## Part 5 — Discovery correctness

**View axis:** All / Aangeboden / Gezocht / Inspiratie (no Services view).

**Category axis:** Food / Garden / Creations / Services.

**Filter combination logic (GeoFeed):**
- Category + search + price: **AND**
- Accepted values (multiple): **OR** within filter, **AND** with other filters
- Services category: client-side via `isMarketplaceServiceItem()`

**Axes clarified:**
- `feedChip` = what rows to show (view intent)
- `discoveryDirection` = UX mode for accepted-values picker (want vs offer copy)

---

## Part 6 — Reverse discovery quality

Verified taxonomy scenarios (OR-match):

| Offer | Taxonomy ID |
|-------|-------------|
| Fruit | `grow.fruit` |
| Photography | `design.photo` |
| Nail styling | `artistic.nails` |
| Transport | `practical.movinghelp` |
| Coaching | `knowledge.coaching` |
| Gardening | `practical.gardenwork` |
| Labour | `practical.handyman` |

Filter: `itemMatchesAcceptedValuesDiscoveryFilter()` — official + pending ids.

---

## Part 7 — Accepted values ecosystem

Single taxonomy SSOT: `taxonomy-resolve.ts` + `taxonomy-normalize.ts`.

| Surface | Component |
|---------|-----------|
| Discovery filter | `AcceptedValuesDiscoveryFilter` |
| Create/edit | `AcceptedValuesPicker` |
| Detail | `ProductDetailAcceptedValuesSection` |
| Tiles | `build-tile-settlement-row` |
| Chips | `AcceptedValueChip` |
| Pending | `PendingAcceptedValueProposalForm` + API |
| Chat prefill | `reverse-discovery-session` → `proposal-prefill` |

Labels via `taxonomyLabelKey()` — no duplicate label tables.

---

## Part 8 — Value economy prominence

Shipped in 10C.13; verified in 10D:

- Hero `heroValueExchange`
- Filter USP tagline (`marketplace.discovery.usp.*`)
- Settlement intro on create + detail
- Guest discover panel bullets

---

## Part 9 — Filter preference persistence

**New in 10D:** `lib/feed/home-filter-persist.ts`

Persisted in `hc_feed_surfaces_v2` → `home`:

```
feedChip, category, scope, radius, sortBy, sortOrder,
searchQuery, q, place, priceMin, priceMax, showFilters,
discoveryDirection, acceptedValues
```

Restore on navigation/refresh within 25 min TTL.

`clearFilters` resets accepted values + discovery direction to defaults.

---

## Part 10 — First impression audit

New user should see within ~10 seconds:

| Message | Where |
|---------|-------|
| Local discovery platform | Hero title + definition |
| Value exchange USP | `heroValueExchange` |
| Ik zoek / Ik bied | Filter sidebar / mobile sheet |
| Barter + accepted values | Settlement copy, chips |
| Safe checkout | Settlement section + Connect guidance |

---

## Part 11 — Regression confirmation

**Unchanged:**
- `canonical-model.ts`, `settlement-options.ts`, `settlement-router.ts`
- Reverse discovery architecture, taxonomy SSOT, tile pipeline
- Stripe Connect, payment providers, proposal architecture

---

## Part 12 — Deferred items

| Item | Reason |
|------|--------|
| Dorpsplein/Inspiratie full canonical migration | Separate surfaces; out of minimal 10D |
| URL share links for accepted values | Not required for pilot |
| Server-side `vertical=services` | Architecture unchanged (client filter) |
| Native app prefs full parity | `hc_app_prefs_v1` partial only |

---

## Validation

```bash
npx tsx scripts/audit-marketplace-discovery-completion-phase10d.ts
npx tsx scripts/backfill-marketplace-data-normalization-phase10c.ts --dry-run
npx tsx scripts/validate-marketplace-discovery-completion-phase10d.ts
npm run lint
npm run build
```
