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

## Changes shipped

| Area | Change |
|------|--------|
| Listing RSC | `loadListingDetail` + page passes `initialData` |
| Listing client | Skips critical `/api/products` when RSC payload present; reviews deferred |
| Profile SSR | Slimmer Dish/Delivery includes; products → `publishedItems` |
| Profile client | `MyDishesManager` seeds from `initialItems` (no seller-products waterfall) |
| Prefetch | `ItemCard` `router.prefetch` on hover |
| Cache | `React.cache` dedupe for listing loader within a request |
| Loading UI | Existing route `loading.tsx` skeletons retained |

## AFTER probe (prod `dpl_8kd3NgYRCVqbxhEskA66FL8MydjN`, h1 useful content)

| Metric | Chromium | Mobile | WebKit |
|--------|----------|--------|--------|
| Listing from feed | 4552ms | 4337ms | 4136ms |
| Listing cold | 6338ms | 2995ms | 3701ms |
| Profile nav | 3146ms | 1935ms | 3146ms |
| Profile cold | 3096ms | 1941ms | 2073ms |
| Second listing | 4790ms | 3918ms | 6047ms |
| Critical `/api/products/{id}` | no | no | no |
| `/api/seller/products` on profile | no | no | no |

Evidence: `perf-probe-tight.json`

## Verdict

`HOMECHEFF_PUBLIC_PERFORMANCE_NO_GO` — critical waterfalls removed and profile much faster, but listing wall-clock (~4–6s) is still above the preferably &lt;2s / near-immediate target.
