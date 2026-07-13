# Phase 3F — Prisma / Connection Analysis

**Datum:** 2026-07-14  
**Modus:** read-only — **geen optimalisatie, geen schema change**

---

## Scope

Beoordeel of voor HomeCheff **aantoonbare winst** bestaat van:

- Prisma Accelerate  
- Prisma Data Proxy  
- Connection pooling (Neon pooler vs Accelerate)

**Niet in scope:** query-refactors, schema, migraties.

---

## Huidige setup

**File:** `lib/prisma.ts`

```typescript
new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});
```

- Singleton; dev hot-reload via `globalForPrisma`
- Comment verwijst naar Neon pooling (`?pgbouncer=true`)
- **Geen** `@prisma/adapter-neon` HTTP driver
- **Geen** Accelerate extension

**Prod feed:** 13 queries, prismaTotalMs warm **~2700–4000 ms** (perfProbe), cold run 1 **8446 ms** (includes parallel overlap accounting).

---

## Waar zit de latency?

| Fase | Warm | Cold run 1 | Dominant? |
|------|------|------------|-----------|
| Product pipeline | ~1512 ms | ~2841 ms | ✅ |
| Dish pipeline | ~928 ms | ~1037 ms | ✅ |
| Trust | ~278 ms | ~1517 ms | Cold only |
| Connect overhead | Niet geïsoleerd | Niet geïsoleerd | Onbekend |

**Conclusie:** Gemeten prod-tijd is **query execution + app logic**, niet geïsoleerde connect handshake. Phase 3F cold issue is **CDN MISS + full pipeline**, niet Prisma ORM overhead alleen.

---

## Prisma Accelerate ([official compare](https://www.prisma.io/docs/accelerate/compare))

| Claim | HomeCheff relevantie |
|-------|---------------------|
| Global connection pool | ✅ serverless many instances |
| HTTP query path | ✅ minder TCP cold per invoke |
| Query result cache | ⚠️ **Risico** — feed trust/visibility moet fresh; alleen safe voor idempotente read slices |
| Managed + API key | Operationele dependency |

### Aantoonbare winst — wanneer?

| Scenario | Verwacht effect | Evidence |
|----------|-----------------|----------|
| Neon compute cold (scale-to-zero) | **200–2000 ms** eerste connect | Extern Neon docs; niet gemeten isolated |
| Connection pool exhaustion | Prevent timeouts | Geen prod evidence van exhaustion |
| Per-query latency warm | **Minimaal** vs direct Neon | Queries already 13× parallel; dominant = query work |
| Accelerate query cache op feed | **HOLD** | Stale trust/visibility; duplicate van CDN/unstable_cache |

**Technische onderbouwing:** Accelerate helpt vooral **connection establishment** en **pooling under burst**. HomeCheff warm path ~2290 ms server is **niet connect-bound** (13 queries complete successfully). Cold path **could** include Neon wake — **niet gemeten**.

**GO/HOLD:** **HOLD** voor Phase 3F. **ORANJE** spike: isolated `SELECT 1` cold timing prod vs Neon always-on branch.

---

## Neon pooler (huidig, vermoedelijk actief)

`DATABASE_URL` met PgBouncer/pooler is standaard Neon+Prisma pattern.

| Effect | Status |
|--------|--------|
| Limit connections per instance | ✅ likely active |
| Remove Neon cold start | ❌ pooler ≠ compute wake |
| Query speed | Neutral vs direct |

**Geen wijziging aanbevolen** zonder Neon dashboard metrics.

---

## `@prisma/adapter-neon` (serverless driver)

HTTP/WebSocket driver naar Neon — elimineert TCP per request in some setups.

| Pro | Con |
|-----|-----|
| Lighter cold connect | Migration path + testing |
| Official Neon integration | All query types must support |

**GO/HOLD:** **HOLD** — winst onbewezen vs pooled TCP; Phase 3F focus cache.

---

## Prisma Data Proxy

Legacy predecessor Accelerate. **Niet aanbevolen** — Accelerate is current ([Prisma docs](https://www.prisma.io/docs/accelerate)).

**HOLD.**

---

## Relation to Phase 3F goals

| 3F maatregel | Prisma impact |
|--------------|---------------|
| CDN HIT | **Bypasses Prisma entirely** — largest win |
| unstable_cache | **Bypasses Prisma** on origin HIT |
| Accelerate | Marginal on warm; possible on cold connect |
| Query optimize | **Out of scope** |

**Prioriteit:** Cache layers >> Accelerate voor anonymous first paint.

---

## Aanbevolen meting vóór Accelerate POV

1. Log `prisma.$connect()` timing isolated in preview (read-only script)  
2. Neon dashboard: compute wake events vs feed latency  
3. Compare cold feed with Neon min compute = 0 vs always-on (staging only)

**Geen productie Neon-wijziging in Phase 3F.**

---

## Eindoordeel Prisma

| Optie | GO/HOLD | Reden |
|-------|---------|-------|
| Prisma Accelerate | **HOLD** | Onbewezen winst; CDN/cache first |
| Accelerate query cache | **HOLD** | Contract/stale risico |
| Neon pooler tweak | **HOLD** | Already standard |
| adapter-neon | **HOLD** | Spike only |
| Always-on Neon compute | **ORANGE** (infra) | Could cut cold connect; cost |

Phase 3F: **geen Prisma-wijzigingen.**
