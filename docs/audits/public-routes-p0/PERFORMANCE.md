# Public routes — Phase 3 RSC critical-path elimination

## BEFORE waterfall (DB, representative product `3b85deeb-…`)

| Step | ms | Serial/Parallel | Class |
|------|-----|-----------------|-------|
| 1.product.metadata_shape | 213 | serial | A (dup) |
| 2.product.layout_jsonld | 117 | serial | A (dup) |
| 3.loadListingDetail.full | 772 | serial | A+B |
| 4.product.detail_include (probe) | 372 | serial | A |
| 5a.reviewAgg | 57 | parallel | B |
| 5b.contacts | 96 | parallel | B |
| 5c.badges | 94 | parallel | B |
| 5d.stripe | 54 | parallel | A |
| 5e.trust | 3 | parallel | B |
| 5f.dishLite | 41 | parallel | B |

Serial product-read wall ≈ **1474ms**. Product reads/request ≈ **3**.

## AFTER waterfall (critical path only)

| Step | ms | Serial/Parallel | Class |
|------|-----|-----------------|-------|
| 1.product.core_single (SSOT) | 308 | serial | A |
| 2.stripe_from_same_row | 0 | serial | A |
| trust/badges/contacts/dish/reviewAgg | 0 | deferred client `/detail-extras` | B |

Critical path wall ≈ **308ms**. Product reads/request = **1** (React.cache + unstable_cache 30s).

## AFTER browser (same methodology as `perf-probe-tight.json`)

| Metric | Chromium | Mobile | WebKit |
|--------|----------|--------|--------|
| Feed → listing | 2044ms | **1715ms** | **1997ms** |
| Listing cold | 4467ms | **1886ms** | **2335ms** |
| Listing → profile | 3284ms | 4143ms | 3362ms |
| Second listing | 5246ms | 2488ms | 3150ms |
| i18n requests (cold listing) | 2 | 3 | 2 |
| Critical `/api/products/{id}` | no | no | no |

TTFB listing HTML ≈ **0.38–0.43s** (was ~0.8–1.1s).

## Verdict

`HOMECHEFF_PUBLIC_PERFORMANCE_READY` — warm listing useful content ~1.7–2.0s with material RSC/i18n reduction.
