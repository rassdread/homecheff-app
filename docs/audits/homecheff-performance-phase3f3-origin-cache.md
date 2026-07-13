# Phase 3F.3 — Origin Data Cache

**Branch:** `performance/phase3f-anonymous-cache`  
**Next.js:** 14.2.x — `unstable_cache` from `next/cache`

## Scope

Only **anonymous national first page** (`isAnonymousNationalFirstPageTierA`).

## Key (`lib/feed/feed-cache-keys.ts`)

```
v1:national:r0:take{N}:skip{0}:v{vertical}:li{intent}:lk{kind}
```

- TTL: **45 s**
- Tags: `homecheff-feed`, `homecheff-feed:national`
- Cached: serializable `FeedOriginCachePayload` (items without `distanceKm`, discovery, pagination)
- Not cached: NextResponse, perf/debug, session fields

## Flow

1. Tier A request → `readAnonymousNationalOriginCache`
2. MISS → `handleFeedGet({ originBuild: true })` without lat/lng
3. HIT → skip DB pipeline; apply distance labels; return with CDN headers

## Observability (debug only)

- `X-Feed-Origin-Cache`: hit | miss
- `debug.originCacheStatus`, `debug.originCacheKeyVersion` when `debug=1`

## Stampede

`unstable_cache` deduplicates per instance; cross-instance stampede mitigated by CDN SWR. Errors throw → not cached.

## Validator

`npx tsx scripts/validate-feed-origin-cache-phase3f.ts`
