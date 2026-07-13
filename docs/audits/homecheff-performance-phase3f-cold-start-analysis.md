# Phase 3F — Cold Start Analysis

**Datum:** 2026-07-14  
**Modus:** read-only — geen wijzigingen

---

## Probleemstelling

Cold productie: **4680–5376 ms client**, **~4742 ms server** (run 1 perfProbe). Nieuwe Vercel-instance → trust-cache leeg, alle Prisma-queries opnieuw.

Warm productie server p50 **~2290 ms** — backend is sneller, maar cold blijft ~2× warm.

---

## Metingen (2026-07-14, homecheff.eu)

### Feed API — Tier A

| Run | x-vercel-cache | TTFB | Opmerking |
|-----|----------------|------|-----------|
| 1 (cold URL) | MISS | 4571 ms | Simulated first visitor |
| 2–6 (bust) | MISS | 1788–2613 ms | Unieke URLs = altijd MISS |
| 1–8 (identical URL) | HIT | 55–121 ms | Edge warm |

### Startup script (cold mode)

| Endpoint | TTFB avg | Total avg | Bytes |
|----------|----------|-----------|-------|
| `/` | 257 ms | **4213 ms** | **4,25 MB** |
| `/api/feed?scope=national&radius=0` | 667 ms* | 669 ms* | 32 KB |

\*Run 1 MISS 1815 ms; runs 2–3 HIT ~94 ms.

### perfProbe cold vs warm (prod, eerdere sessie)

| | Run 1 (cold) | Warm p50 |
|--|--------------|------------|
| serverMs | 4742 | ~2290 |
| prismaQueryCount | 13 | 13 |
| prismaTotalMs | 8446 | ~3500 |
| trustMs | 1517 | ~278 |

---

## Cold-start componenten (hypothese + code)

| Component | Geschatte bijdrage | Bewijs |
|-----------|-------------------|--------|
| **Vercel function init** | 200–800 ms | Server minus prisma op cold run |
| **Node module load** | 100–400 ms | Groot Next.js bundle, geen lazy prisma import |
| **PrismaClient init** | 50–150 ms | `lib/prisma.ts` singleton at import |
| **Neon TCP connect** | 100–500 ms warm; **500–3000 ms** cold compute | Neon docs; geen directe connect timing gemeten |
| **13 Prisma queries** | ~2000–3500 ms warm | perfProbe counts |
| **Trust cold (0 cache hits)** | ~1500 ms run 1 vs ~278 warm | trustCacheHits 0→4 |
| **Discovery/transform** | ~200–400 ms | timing buckets |
| **CDN MISS** | Geen edge shortcut | x-vercel-cache |

**Geen lazy imports vandaag:** `app/api/feed/route.ts` importeert volledige pipeline bij cold invoke.

---

## Trust-cache en instance lifecycle

`lib/discovery/trust/trust-snapshot-cache.ts`:

- In-process `Map`, TTL 60 s, max 200 entries
- **Niet gedeeld** tussen Vercel instances/regions
- Cold instance: 4 trust misses × ~370 ms ≈ **1500 ms** (run 1)

**3F-impact:** CDN/origin cache vermindert cold **frequency**, niet per-instance trust cold. Trust blijft cold-penalty op echte MISS.

---

## Neon cold start (extern, technisch)

Neon compute scale-to-zero na inactiviteit → eerste connectie kan **500 ms – several seconds** adden ([Neon serverless docs](https://neon.tech/docs/guides/prisma-connection-pooling)). HomeCheff gebruikt pooled `DATABASE_URL`; geen `@prisma/adapter-neon` HTTP driver in `lib/prisma.ts`.

**Niet gemeten:** isolated `SELECT 1` cold vs warm op prod zonder feed route.

---

## Wat 3F níet oplost (bewust)

| Item | Reden |
|------|-------|
| Query count 13 | Out of scope Phase 3F |
| DishVideo.findMany | Out of scope |
| Function bundle size | Geen refactor in 3F |
| Neon always-on | Infra beslissing, geen code |

---

## Cold-start mitigatie (alleen cache/render)

| Maatregel | Cold impact | GO |
|-----------|-------------|-----|
| CDN Tier A HIT | **−95% TTFB** (4571→60 ms) | ✅ bestaand, verhoog HIT-rate |
| Origin unstable_cache | **−40–60%** op MISS | ✅ |
| Trust CDN/origin cache | **−1500 ms** run 1 | ORANJE (trust in JSON) |
| Cron edge warm | Minder cold MISS | ✅ |
| Provisioned concurrency | −200–500 ms init | HOLD (kosten) |
| Prisma Accelerate | Connect pooling | Zie prisma-analysis |

---

## Verwachting cold na 3F

| Metriek | Nu | Na 3F |
|---------|-----|-------|
| Feed TTFB (edge HIT) | ~60 ms | ~60 ms |
| Feed TTFB (edge MISS, origin hit) | ~2500 ms | **~800–1200 ms** |
| Feed TTFB (full cold instance) | ~4700 ms | **~2500–3500 ms** |
| Client cold tot tiles | ~5000 ms | **~2500–4000 ms** |

Volledige eliminatie van ~5 s cold vereist **edge HIT** of **pre-rendered feed shell** — niet alleen origin tuning.
