# Phase 3E+ — Final GO / NO-GO

**Datum:** 2026-07-13  
**Branch:** `performance/phase3e-production-cold-path`  
**Baseline:** Phase 3E @ `2c91ef1` (Vercel preview warm server p50 **3234 ms**)

---

## Samenvatting

Phase 3E+ implementeert een **IDs-first + batch-hydration** pipeline voor Product en Dish, met **seller/user batching** en **route-level parallelisatie** (product ID-fase → parallel dish hydrate + metadata + listing).

Functioneel: **volledige parity** (visibility, Stripe, media, trust, discovery, pagination, single fetch).  
Performance lokaal prod-mode: **sterke winst** vs 3E Vercel-cijfers.  
Vercel preview 3E+: **niet gemeten** (geen push/deploy per instructie).

---

## 1. Nieuwe architectuur

```text
Product:  ID split_or → body IN → batchHydrateFeedSellers
Dish:     minimal select → batch users + dishPhoto + dishVideo IN
Route:    ID-fase → parallel (hydrate | dish | metadata | listing)
Seller:   één sellerProfile.findMany + één user.findMany (dishes)
Media:    gescheiden product/dish metadata batches, parallel
Cache:    Tier A CDN ongewijzigd; origin unstable_cache **voorstel only**
```

---

## 2–4. Product / Dish / Seller voor-na (warm p50)

| Metriek | 3E Vercel | 3E+ lokaal | Δ |
|---------|-----------|------------|---|
| Product wall | 1292 ms | **537 ms** | −58% |
| Dish wall | 1205 ms | **577 ms** | −52% |
| Seller hydrate | n.v.t. | **43 ms** | nieuw |

---

## 5. Media batching

- Product: `loadProductImageMetadata` parallel met hydrate.
- Dish: photo/video IN in IDs-first; metadata CDN-resolve apart (`dishMetadataMs`).
- Geen gecombineerde cross-entity batch (niet contractveilig).

---

## 6. Cachevoorstel

- **Huidig:** Tier A CDN `s-maxage=45` voor anonymous national.
- **Voorstel 3F:** `unstable_cache` origin 45 s — zie `homecheff-performance-phase3ep-anonymous-cache.md`.
- **3E+:** niet geïmplementeerd.

---

## 7. Responsegrootte

~**40 800 bytes** (10 items, warm). Geen compactie toegepast.

---

## 8–9. Query count & Prisma total

| | 3E preview | 3E+ lokaal |
|--|------------|------------|
| Query count | 8 | **13** |
| Prisma total warm p50 | n.v.t. | **~1460 ms** |

---

## 10–11. Server & client p50

| | 3E Vercel warm | 3E+ lokaal warm |
|--|----------------|-----------------|
| **Server** | 3234 ms | **865 ms** |
| **Client** | 3557 ms | **873 ms** |

**15%-drempel (≤2749 ms server):** lokaal **gehaald**; Vercel **onbevestigd**.

---

## 12. Risico's

| Risico | Ernst | Mitigatie |
|--------|-------|-----------|
| Vercel latency ≠ lokaal | Hoog | Preview-probe na gecontroleerde push |
| Query count 8→13 | Medium | Monitor Neon; payloads kleiner |
| `DishVideo.findMany` slowest | Medium | Volgende optimalisatiefase |
| Product module isolatie trager | Laag | Route-parallelisatie compenseert |
| Origin cache stale 45 s | Laag | Al CDN-semantiek Tier A |

---

## 13. GO / HOLD

| Besluit | Onderdeel |
|---------|-----------|
| **GO implementatie** | Code klaar, validators groen, parity bewezen |
| **HOLD commit/push** | Vercel preview 3E+ niet gemeten; user-regel ≥15% op **preview** |
| **HOLD merge main** | Zelfde reden + geen productie-deploy |
| **HOLD productie** | Geen BCPD uitgevoerd |

### Aanbevolen volgende stap

1. Gebruiker keurt **preview deploy van lokale branch** goed (zonder merge main), **of**
2. Handmatige Vercel preview-build van uncommitted work via preview branch push **met expliciete GO**.

Bij Vercel warm server p50 ≤ **2749 ms**: **GO commit + push + merge-overweging**.

---

## 14. Bevestigingen

| Actie | Uitgevoerd? |
|-------|-------------|
| Database-migratie | **NEE** |
| `prisma migrate deploy` | **NEE** |
| Merge naar `main` | **NEE** |
| Productie-deployment (Vercel `--prod`) | **NEE** |
| Render-wijziging | **NEE** |
| Git commit / push 3E+ | **NEE** (wacht op preview-meting) |

---

## Validatorbevestiging

- Product parity ✅  
- Dish parity ✅  
- Seller parity ✅  
- Media parity ✅  
- Payment/Stripe parity ✅  
- Pagination/filters/radius ✅  
- Discovery/trust ✅  
- Cache safety (ongewijzigd) ✅  
- No second feed fetch ✅  
- lint / build / smoke-check / prisma validate ✅  

---

**Eindoordeel: HOLD** — sterke lokale indicatie, maar **geen commit/push/merge** tot Vercel preview ≥15% server-winst vs 3E (**3234 → ≤2749 ms**) is aangetoond.
