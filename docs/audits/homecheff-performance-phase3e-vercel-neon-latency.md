# Phase 3E — Vercel ↔ Neon Latency

**Datum:** 2026-07-13  
**Methode:** read-only env + ping (geen providerwijziging)

---

## Feiten

| Item | Waarde |
|------|--------|
| Neon pooler host | `ep-summer-darkness-a2l0745u-pooler.eu-central-1.aws.neon.tech` |
| Neon direct host | `ep-summer-darkness-a2l0745u.eu-central-1.aws.neon.tech` |
| Neon regio | **eu-central-1** (Frankfurt) |
| Vercel regio (verwacht EU) | **fra1** (Frankfurt) — project setting |
| PgBouncer / pooler | ✅ `pooler` host + `pgbouncer=true` pattern |
| Prisma Accelerate | **Afwezig** |
| DIRECT_URL in runtime | Niet gebruikt door `lib/prisma.ts` (alleen `DATABASE_URL`) |

---

## Ping metingen (lokaal → Neon pooler)

| Run | ms |
|-----|-----|
| 1 (cold connect) | 1030 |
| 2–5 | 19–23 |

**p50 na warmte:** ~21 ms (lokaal, zelfde continent)

---

## Productie-implicatie

| Context | Typische RTT per Prisma query |
|---------|------------------------------|
| Lokaal dev → Neon | ~20–200 ms |
| Vercel fra1 → Neon eu-central-1 | **~80–150 ms** per hop (7 queries ≈ 560–1050 ms minimum) |
| Gemeten Product bucket Vercel | **1200–1866 ms** |

**Verschil lokaal vs Vercel Product:** ~6× — verklaard door serverless cold + connection setup + query payload, niet door verkeerde regio.

---

## Advies (geen providerwijziging)

| Optie | Verwachte winst | Aanbeveling |
|-------|-----------------|-------------|
| Region alignment Vercel↔Neon | Al aligned | **Geen actie** |
| Read replica | Latency + complexity | **Later** — buiten 3E |
| Prisma Accelerate | Cache + edge | **Evaluate later** — kosten/complexiteit |
| Query refactoring (smaller selects, fewer roundtrips) | **Hoog** | **P0 in 3E** |
| Connection warming | Matig op serverless | Beperkt — accept cold start |
| CDN Tier A (anonymous national) | **Hoog voor repeat** | Al aanwezig — meet HIT rate |

**Conclusie:** region-alignment levert **minder** winst dan query-payload/parallelisatie bij huidige setup.
