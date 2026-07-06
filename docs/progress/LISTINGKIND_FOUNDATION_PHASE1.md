# ListingKind Foundation — Phase 1 Progress

**Status:** Complete (implementation)  
**Last updated:** 2026-07-06  
**Prerequisite:** Trust Stabilization Phase 0 ✅

## Completed

### 1A — ListingKind foundation
- [x] Canonical types in `lib/marketplace/contracts/listing-kind-contract.ts`
- [x] No database fields or migrations
- [x] Kinds: PRODUCT, SERVICE, TASK, WORKSHOP, COACHING, REQUEST, INSPIRATION
- [x] DELIVERY / COMMUNITY_ORDER / PROPOSAL excluded (operational entities)

### 1B — deriveListingKind()
- [x] `lib/marketplace/listing-kind/derive-listing-kind.ts`
- [x] Precedence per LISTING_KIND_SPEC.md
- [x] Dev audit logging (`audit.ts`)
- [x] Re-export barrel `lib/marketplace/listing-kind/index.ts`

### 1C — Feed classification
- [x] Feed items receive `listingKind` field
- [x] `/api/feed` attaches listingKind + taxonomy
- [x] `deriveFeedTaxonomy()` uses ListingKind for kind/direction
- [x] GeoFeed `normalizeFeedItem` + card types updated
- [x] No ranking, ordering, or score changes

### 1D — Profile filters
- [x] Extended `ProfileV2AanbodFilter` + live filter chips
- [x] `matchesProfileAanbodFilter()` in profile-filter.ts
- [x] ProductManagement filters by ListingKind + trade (barterOpenness)
- [x] Seller products API returns listingIntent, barterOpenness

### 1E — REQUEST normalization
- [x] REQUEST href → `/product/[slug]` (temporary)
- [x] FeedMarketplaceCard renders REQUEST via FeedSaleCard (no null/placeholder)
- [x] TASK/BARTER href → `/product/[slug]`

### 1F — Mapping audit
- [x] `docs/audits/LISTING_KIND_MAPPING_AUDIT.md`

### 1G — Product vs Dish leaks
- [x] Dish always → INSPIRATION listingKind
- [x] `isMarketplaceSaleItem` excludes DISH / INSPIRATION
- [x] Feed dish transform uses actual `dish.category` (not hardcoded CHEFF)
- [x] Price fields retained; classification only

### 1H — Shared contracts
- [x] `lib/marketplace/contracts/listing-kind-contract.ts`

### 1I — Documentation
- [x] This file
- [x] LISTING_KIND_SPEC.md status updated to implemented

---

## Files changed

| Area | Files |
|------|-------|
| Core | `lib/marketplace/contracts/listing-kind-contract.ts`, `lib/marketplace/listing-kind/*` |
| Feed | `lib/feed/feed-taxonomy.ts`, `lib/feed/feed-types.ts`, `lib/feed/marketplace-sale.ts`, `lib/feed/feed-item-href.ts`, `app/api/feed/route.ts`, `components/feed/GeoFeed.tsx`, `GeoFeedCards.tsx`, `FeedMarketplaceCard.tsx` |
| Profile | `lib/profile/profile-v2/types.ts`, `lib/create/offering-vertical.ts`, `components/profile/ProductManagement.tsx`, `app/api/seller/products/route.ts` |
| i18n | `public/i18n/nl.json`, `public/i18n/en.json` |
| Docs | `docs/audits/LISTING_KIND_MAPPING_AUDIT.md`, `docs/architecture/LISTING_KIND_SPEC.md` |

---

## Known ambiguities

See [LISTING_KIND_MAPPING_AUDIT.md](../audits/LISTING_KIND_MAPPING_AUDIT.md).

- DESIGN category service vs physical goods
- KNOWLEDGE tutoring vs coaching
- Profile MyDishesManager legacy price-based dish filtering on public URLs
- Legacy Listing entity still in feed pool

---

## Future work (not Phase 1)

| Item | Blocker for Discovery? |
|------|------------------------|
| `/request/[slug]` route | Medium |
| Gezocht profile tab | Medium |
| Search uses ListingKind | **Yes** |
| SEO schema by kind | No (parallel) |
| Optional `listingKind` DB cache | No |
| Legacy Listing deprecation | Medium |
| Profile public grid dish price leak cleanup | Medium |

---

## Discovery dependencies resolved

- ✅ Single `deriveListingKind()` for all consumers
- ✅ Feed items classified consistently
- ✅ Dish/commerce separation enforced in sale classifier
- ✅ Profile type filters operational
- ✅ REQUEST links functional

## Discovery dependencies remaining

- Search index/filter integration
- Dedicated request routes + Gezocht section
- ListingKind-aware empty states and chips in GeoFeed UI
- Legacy Listing migration

---

## Validation

Run before merge:

```bash
npm run lint
npm run build
```

Manual smoke:
- Feed loads (all / sale / inspiration chips)
- Product detail opens
- Dish/recipe/garden/design pages open
- REQUEST listing opens via product URL
- Profile Aanbod filters (products, services, tasks, …)
