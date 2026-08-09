# Selective restore — Phase 3 summary

## Restored

| File | Change |
|------|--------|
| `components/feed/GeoFeed.tsx` | Primary `salePoolForRanking` → progressive Nearby (`composeProgressiveNearbySalePool`); restore `progressiveWidenActive` from `saleWiderPool` |
| `components/home/HomeMobileFeedInserts.tsx` | `data-hc-feed-insert` markers for cert (behaviour unchanged) |
| `components/home/HomeVerticalChipStrip.tsx` | `data-testid` / `data-hc-feed-insert` |
| `scripts/test-radius-filter-chain.ts` | Expect progressive primary pool (not radius-strict-only) |
| `scripts/validate-feed-composition-progressive-discovery.ts` | Assert primary pool wiring |

## Intentionally NOT restored / NOT reverted

- Public routes / `lib/routing/public-hrefs.ts` / listing RSC perf
- Media auth (`f0e31def` and related)
- Identity / SSO commits
- Instant radius apply (`handleRadiusChange`)
- Broadened discovery stage after exact exhaust (`1eac6e55`…`fc14a950`)
- `FeedSearchContextBar`
- Whole-tree checkout of `5d500f3d`

## CTA types restored (already present; visibility via inventory)

- verticals, pulse, promo:android-beta, reputation, promo:affiliate-12-12, share, promo:werken-bij
- plus activity / exchange / growth inserts when eligible

## Insertion intervals

| afterFeedIndex | insert |
|----------------|--------|
| 1 | verticals |
| 3 | pulse |
| 4 | promo android-beta |
| 7 | reputation (logged-in) |
| 8 | promo affiliate-12-12 |
| 11 | share |
| 12 | promo werken-bij |

Initial page take: **10** (`FEED_FIRST_PAGE_TAKE`).
