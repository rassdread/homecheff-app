# Phase 3E — Product Query Handoff

**Datum:** 2026-07-13  
**Branch:** `performance/phase2-baseline`  
**Status:** handoff only — **geen optimalisatie in deze fase**

---

## 1. Probleem

Preview (3D-Final, 3 runs):

| Run | Product.findMany |
|-----|------------------|
| 1 | 1504 ms |
| 2 | 1302 ms |
| 3 | 1296 ms |
| **Gem** | **~1367 ms** |

Dit is nu de **grootste stabiele bottleneck** (warm én cold). Trust warm is opgelost; Product niet.

---

## 2. Exacte query

Bron: [app/api/feed/route.ts](app/api/feed/route.ts) (~304–389)

```typescript
prisma.product.findMany({
  where: {
    OR: [
      { isActive: true },
      {
        isActive: false,
        orderItems: { some: { Order: { stripeSessionId: { not: null } } } },
      },
    ],
    // optional: q, listingIntent, category
  },
  orderBy: [{ createdAt: 'desc' }],
  take: FEED_DB_PRODUCT_CAP, // 40
  select: { /* ~20 product fields */ seller: { User: { /* 12 fields */ } }, Image, Video },
});
```

Metadata-images: apart via [lib/feed/feed-media-metadata.server.ts](lib/feed/feed-media-metadata.server.ts) (raw SQL, `text[]`).

---

## 3. Diagnose (samenvatting)

| Factor | Impact | Bewijs |
|--------|--------|--------|
| Neon serverless RTT + pooler | **Hoog** | Lokaal Prisma p50 195 ms vs preview ~1300 ms |
| Brede `select` + nested `seller.User` | **Hoog** | 12+ user-velden per product |
| OR + EXISTS (inactive+Stripe) | Medium | Plan flip bij inactive products |
| Index | Laag | `Product_isActive_createdAt_idx` bestaat |
| Image bytes | Laag na 3C | Alleen `sortOrder` in hoofdquery |

Script: [scripts/diagnose-feed-product-query-phase3d-final.ts](scripts/diagnose-feed-product-query-phase3d-final.ts)

---

## 4. Phase 3E voorstellen (prioriteit)

### P0 — Meet eerst op productie-achtige row count

1. Preview `EXPLAIN (ANALYZE, BUFFERS)` op feed-OR-query met `Buffers`.
2. Vergelijk active-only vs volledige OR — is Stripe-tak dominant?

### P1 — Select-trimming (contract-review)

- `seller.User`: alleen feed-tile-velden (id, name, username, profileImage, stripe*).
- Product: verwijder ongebruikte kolommen uit feed-transform audit.

### P2 — Query-structuur (alleen bij bewezen winst)

- Splits OR in twee parallelle queries + merge/dedup (alleen als EXPLAIN toont zware EXISTS).
- **Niet** Stripe-OR verwijderen zonder business sign-off.

### P3 — Infra (later)

- Connection warming / read replica — buiten 3E code scope.

---

## 5. Acceptatiecriteria 3E

| Metriek | Huidig | Target |
|---------|--------|--------|
| Product p50 preview | ~1300 ms | **< 800 ms** |
| Server p50 warm | ~3175 ms | **< 3000 ms** |
| Feed contract | intact | validators 3A/3C pass |

---

## 6. Validators bij start 3E

- `diagnose-feed-product-query-phase3d-final.ts`
- `validate-feed-queries-phase3c.ts`
- `validate-feed-contract-phase3a.ts`
- Preview 5+ runs met `perfBust`

---

## 7. Expliciet niet in 3E

- Geen Dish-index wijzigingen (al live).
- Geen trust-cache wijzigingen (werkt).
- Geen Render-wijzigingen.
