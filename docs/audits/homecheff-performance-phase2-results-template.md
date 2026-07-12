# HomeCheff Performance Phase 2 — Results Template

**Datum meting:** _______________  
**Omgeving:** lokaal / preview / productie  
**Uitgevoerd door:** _______________  
**Flags:** `FEED_PERF_TIMING=___` · `NEXT_PUBLIC_FEED_PERF_BASELINE=___`

---

## 1. Homepage anoniem — cold (3 runs)

| Run | Timestamp | `/` TTFB ms | `/` total ms | FCP ms | LCP ms | CLS | Notes |
|-----|-----------|------------|--------------|--------|--------|-----|-------|
| 1 | | | | | | | |
| 2 | | | | | | | |
| 3 | | | | | | | |

**Gemiddelde:** TTFB ___ · FCP ___ · LCP ___

---

## 2. Homepage anoniem — warm (3 runs)

| Run | Timestamp | `/` TTFB ms | `/` total ms | FCP ms | LCP ms | session ms | feed blocked ms | app usable ms |
|-----|-----------|------------|--------------|--------|--------|------------|-----------------|---------------|
| 1 | | | | | | | | |
| 2 | | | | | | | | |
| 3 | | | | | | | | |

**Gemiddelde:** TTFB ___ · app usable ___

---

## 3. Homepage ingelogd — cold (3 runs)

| Run | Timestamp | `/` TTFB ms | session ms | profile/me calls | feed TTFB ms | app usable ms |
|-----|-----------|------------|------------|------------------|--------------|---------------|
| 1 | | | | | | |
| 2 | | | | | | |
| 3 | | | | | | |

---

## 4. Homepage ingelogd — warm (3 runs)

| Run | Timestamp | `/` TTFB ms | cache hit? | feed TTFB ms | duplicate fetches? | app usable ms |
|-----|-----------|------------|------------|--------------|-------------------|---------------|
| 1 | | | | | | |
| 2 | | | | | | |
| 3 | | | | | | |

---

## 5. Feed API — cold (3 runs)

Script: `npm run perf:startup:cold -- --base-url=___`

| Run | Timestamp | Status | TTFB ms | Total ms | Bytes | Server-Timing (summary) |
|-----|-----------|--------|---------|----------|-------|-------------------------|
| 1 | | | | | | |
| 2 | | | | | | |
| 3 | | | | | | |

**Gemiddelde:** TTFB ___ · Total ___ · Bytes ___

### Server-Timing breakdown (avg)

| Bucket | ms |
|--------|-----|
| auth | |
| geo | |
| feed-db | |
| stats | |
| trust | |
| discovery | |
| mapping | |
| serialize | |
| prisma | |
| total | |

---

## 6. Feed API — warm (3 runs)

Script: `npm run perf:startup:warm -- --base-url=___`

| Run | Timestamp | Status | TTFB ms | Total ms | Bytes | Server-Timing (summary) |
|-----|-----------|--------|---------|----------|-------|-------------------------|
| 1 | | | | | | |
| 2 | | | | | | |
| 3 | | | | | | |

**Cold − warm delta TTFB:** ___ ms (___ %)

---

## 7. Database / Prisma (from `debug.perf` or Server-Timing)

| Metric | Run 1 | Run 2 | Run 3 | Avg |
|--------|-------|-------|-------|-----|
| prisma query count | | | | |
| prisma total ms | | | | |
| feed-db category ms | | | | |
| trust category ms | | | | |
| stats category ms | | | | |
| slowest query key | | | | |
| slowest query ms | | | | |

---

## 8. Client milestones (from `__hcFeedPerfReport()`)

| Milestone | Anon cold | Anon warm | Logged cold | Logged warm |
|-----------|-----------|-----------|-------------|-------------|
| home:shell-mounted | | | | |
| session:resolved | | | | |
| feed:blocked-end | | | | |
| feed:request-start | | | | |
| feed:json-received | | | | |
| feed:first-tile-rendered | | | | |
| feed:first-image-visible | | | | |
| app:usable | | | | |

---

## 9. Duplicate requests detected

| Path | Call count | Overlaps? | Initiator (if known) |
|------|------------|-----------|----------------------|
| /api/feed | | | |
| /api/profile/me | | | |
| /api/auth/session | | | |
| /api/inspiratie | | | |
| /api/user/me | | | |

---

## 10. Web Vitals

| Metric | Anon | Logged | Target |
|--------|------|--------|--------|
| FCP ms | | | < 1800 |
| LCP ms | | | < 2500 |
| INP ms | | | < 200 |
| CLS | | | < 0.1 |
| TTFB ms | | | < 800 |

---

## 11. Hydration

| Metric | ms |
|--------|-----|
| shell-mounted → viewport-resolved | |
| shell-mounted → layout:hydration-complete | |
| geofeed mount count | |
| feed fetch count | |

---

## 12. Android Capacitor

| Run | Type | Network | Auth | Splash ms | Shell ms | Feed ms | Usable ms |
|-----|------|---------|------|-----------|----------|---------|-----------|
| 1 | cold | wifi | anon | | | | |
| 2 | cold | wifi | anon | | | | |
| 3 | cold | wifi | anon | | | | |
| 1 | warm | wifi | anon | | | | |
| 2 | warm | wifi | anon | | | | |
| 3 | warm | wifi | anon | | | | |
| 1 | cold | mobile | logged | | | | |

---

## 13. Bundle sizes (`npm run analyze`)

| Chunk / module | Size (KB) | Notes |
|----------------|-----------|-------|
| GeoFeed | | |
| NavBar | | |
| vendors | | |
| react | | |
| pusher-js | | |
| lucide-react | | |
| emoji-picker | | |
| @stripe/stripe-js | | |
| socket.io (if any) | | |
| First load JS total | | |

---

## 14. Conclusies (invullen na meting)

### Bevestigde bottlenecks

1. ___
2. ___
3. ___

### Cold start % van feed TTFB

___ % (cold avg ___ ms − warm avg ___ ms)

### Render nodig?

ja / nee / alleen cron — motivatie: ___

### Volgende acties (Fase 3)

| Prioriteit | Actie |
|------------|-------|
| P0 | |
| P1 | |
| P2 | |

---

## 15. Raw JSON attachments

- [ ] [Startup meettool](../../scripts/performance/measure-homecheff-startup.mjs) output (cold)
- [ ] [Startup meettool](../../scripts/performance/measure-homecheff-startup.mjs) output (warm)
- [ ] `window.__hcFeedPerfReport()` screenshot/export
- [ ] Lighthouse report HTML
- [ ] Bundle analyzer HTML export
