# Phase 3F — Cache Matrix

**Datum:** 2026-07-14  
**Machine-readable:** `homecheff-performance-phase3f-cache-inventory.json`

---

## Matrix: request → cache tier → stores

| Request profile | Tier | Edge CDN | Browser HTTP | Origin Data Cache | In-process trust | Client return cache |
|-----------------|------|----------|--------------|-------------------|------------------|---------------------|
| Anon national, no coords, page 1 | **A** | ✅ 45s+SWR90 | Bypass (`no-store` fetch) | ❌ | ❌ cold instance | ❌ first visit |
| Anon national + lat/lng (labels) | **B** ⚠️ | ❌ | Bypass | ❌ | ❌ | ❌ |
| Anon + filters/q | C | ❌ | Bypass | ❌ | ❌ | ❌ |
| Logged in | C | ❌ | Bypass | ❌ | ✅ 60s warm | ✅ tab return |
| perfProbe=1 | D | ❌ | Bypass | ❌ | ❌ | ❌ |
| Nearby + radius | B | ❌ | Bypass | ❌ | varies | varies |

---

## Privacy & auth checklist (Tier A veiligheid)

| Factor | In feed JSON voor anon national? | Cache-safe? |
|--------|----------------------------------|-------------|
| userId / session | Nee | ✅ |
| Favorites per user | Nee (deferred stats) | ✅ |
| Private listings | Uitgesloten via visibility | ✅ |
| Stripe inactive paid | Zelfde pool voor iedereen | ✅ |
| Trust scores | Seller-level, geen user PII | ✅ |
| Discovery activity cards | Alleen bij userId (Tier C) | ✅ |
| Personalized ranking | Niet voor anon default | ✅ |
| Cookie op request | Tier A zet geen `Vary: Cookie` | ⚠️ audit 3B: cookie+browser cache risico; edge OK |

**Conclusie:** Tier A is **functioneel veilig** voor anonieme national page-1 zolang geen session cookie de response wijzigt. Route classificeert op `userId` vóór render — cookie zonder session blijft Tier A.

---

## Cache key factoren

| Factor | In cache key vandaag? | Moet in key? |
|--------|----------------------|--------------|
| scope | ✅ query string | ✅ |
| radius | ✅ | ✅ |
| take/skip | ✅ | ✅ |
| vertical/q/filters | ✅ (Tier C) | ✅ |
| lat/lng | ✅ (downgrades tier) | ❌ voor national labels-only (3F fix) |
| Origin | Vary | ✅ |
| Cookie | Tier B/C Vary | Alleen C |

---

## Stale data acceptatie

| Layer | TTL | Stale max | User impact |
|-------|-----|-----------|-------------|
| Edge Tier A | 45 s | +90 s SWR | Nieuwe listing max ~2 min zichtbaar |
| Origin unstable_cache (voorstel) | 45 s | tag invalidation | Publish hook → direct refresh |
| Trust in-process | 60 s | — | Trust badge max 1 min oud op warm instance |
| Homepage ISR | 60 s | — | Shell/inspiratie SSR |
| Media CDN | 7 d | 1 d SWR | Afbeeldingen lang cached |

**Acceptabel voor marketplace feed page-1** mits publish invalidation bestaat.

---

## Dubbele / conflicterende headers

| Bron | Header | Effect |
|------|--------|--------|
| `lib/apiCors.ts` | `Cache-Control: no-store` | Overschreven door feed route |
| Feed route | Tier policy | **Wins** |
| Client fetch | `cache: 'no-store'` | Alleen browser fetch cache |

---

## GO/HOLD per cache-maatregel

| Maatregel | GO/HOLD | Reden |
|-----------|---------|-------|
| Tier A national+coords fix | **GO** (na parity) | 60 ms vs 3000 ms gemeten |
| Vercel-CDN-Cache-Control split | **GO** | Officieel Vercel-patroon |
| Origin unstable_cache 45s | **GO** | MISS latency |
| Browser fetch cache voor Tier A | **ORANJE** | Weinig winst vs edge; cookie risico |
| TTL 45→120 s | **HOLD** | Stale zonder tags |
| Vary: Cookie op Tier A | **ORANJE** | Veiliger maar meer MISS |
| CDN cache logged-in feed | **HOLD** | Privacy |

---

## Revalidation triggers (voorstel)

```text
Product/Dish/Listing publish → revalidateTag('feed-national-v1')
Admin visibility toggle      → revalidateTag('feed-national-v1')
Deploy                       → natural SWR (geen actie)
```

Geen DB-migratie vereist.
