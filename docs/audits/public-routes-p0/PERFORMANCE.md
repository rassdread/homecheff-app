# Public routes — Phase 2 performance hardening

## Critical path (BEFORE)

### A. Feed → listing (client nav)
1. Next.js soft nav / RSC shell
2. Client `ListingDetailPage` mount → skeleton
3. **Blocking** `GET /api/products/{id}` (heavy Prisma include + dish media + trust)
4. Then serial `GET /reviews` + optional `/api/profile/me`
5. Image LCP after JSON parse

Measured useful content: **~7.5–8.9s** (production certify)

### B. Listing → profile
1. Soft nav to `/user/...`
2. Fat SSR user select (Dish×48 + growthPhotos + reviews + products×48)
3. Client hydrates; `MyDishesManager` `ssr:false` then **re-fetches** `/api/seller/products`
4. Stats via `/api/user/{id}/stats`

Measured: **~10–11.5s** client / **~9s** cold

### C–E
Second listing and cold loads still paid the client product API tax.

## Changes shipped

| Area | Change |
|------|--------|
| Listing RSC | `loadListingDetail` + `app/product/[id]/page.tsx` passes `initialData` |
| Listing client | Skips critical `/api/products` when RSC payload present; reviews deferred |
| Profile SSR | Slimmer Dish/Delivery includes; products mapped to `publishedItems` |
| Profile client | `MyDishesManager` seeds from `initialItems`, no seller-products waterfall on aanbod |
| Prefetch | `ItemCard` `router.prefetch` on hover; existing Link prefetch on tiles/names |
| Cache | `React.cache` dedupe for listing loader within a request |
| Loading UI | Existing `loading.tsx` skeletons retained |

## Query counts

| Path | BEFORE (approx) | AFTER |
|------|-----------------|-------|
| Listing useful body | Layout product×2 + full API product + dish media + reviews rows (multi-request) | **~7** parallelizable Prisma ops in one RSC load |
| Profile first paint | Fat nested user + client seller products re-query | Slim user + products in SSR; **0** seller-products API for aanbod first paint |

## Targets

- Useful listing preferably &lt;2s; profile &lt;2.5s after deploy (measure in `perf-probe.json`)
- No avoidable client API waterfall for critical content
