# Phase 3F — Before / After

**Branch:** `performance/phase3f-anonymous-cache`  
**Baseline:** production post 3E+ (`7575fae`)

## Production baseline (pre-3F)

| Scenario | TTFB / server |
|----------|---------------|
| CDN HIT Tier A | ~55–121 ms |
| CDN MISS / origin warm | ~2290 ms server p50 |
| Cold origin | ~4680–5376 ms |
| Client warm | ~2545 ms |

## Expected after 3F (preview — not measured locally yet)

| Scenario | Expected |
|----------|----------|
| CDN HIT | ~55–120 ms (unchanged) |
| Origin cache HIT + CDN MISS | ~200–800 ms (skip 13 Prisma queries) |
| Origin MISS | ~2290 ms warm (unchanged pipeline) |
| National + lat/lng | Tier A CDN HIT (~60 ms vs ~3000 ms before) |

## Probe

```bash
FEED_PROBE_BASE=https://preview-url npx tsx scripts/probe-feed-cache-phase3f.ts
```

Output: `docs/audits/homecheff-performance-phase3f-probe-latest.json`

**No win claim until preview measurements.**
