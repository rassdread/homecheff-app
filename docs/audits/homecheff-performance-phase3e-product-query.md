# Phase 3E — Product Query Analysis

**Datum:** 2026-07-13  
**Module:** `lib/feed/feed-product-query.server.ts`  
**Default strategy:** `split_or`

---

## Huidige semantics (behouden)

```typescript
OR: [
  { isActive: true },
  { isActive: false, orderItems: { some: { Order: { stripeSessionId: { not: null } } } } },
]
orderBy: createdAt desc
take: FEED_DB_PRODUCT_CAP (60)
```

Post-filter: `passesFeedProductStripeFilter` (contact-only, free, non-test Stripe).

---

## Varianten gemeten (lokaal, shared Neon, 7 producten)

| Variant | p50 ms | Rows | Stripe-filter parity |
|---------|--------|------|---------------------|
| A `or_single` | 237 | 7 | 7 |
| B `split_or` | **215** | 7 | 7 |
| C `trimmed_or` | 223 | 7 | 7 |

**ID-volgorde:** identiek over alle varianten ✅

---

## Productie (homecheff.eu, pre-3E deploy)

| Run | dbProductMs |
|-----|-------------|
| Cold | **1866** |
| Warm 2 | **1204** |
| Warm 3 | **1328** |

**Hoofdoorzaak op Vercel:**

1. **RTT** — lokaal Prisma p50 ~179 ms vs productie ~1200 ms (≈6–7× netwerk)
2. **Brede nested select** — `seller.User` 12 velden + `Image.sortOrder` + `Video` per product
3. **OR + EXISTS** — op kleine DB negligible (EXPLAIN: seq scan 7 rows); op grotere datasets mogelijk zwaarder

EXPLAIN (lokaal): beide OR-plannen < 0.05 ms execution — **index niet de bottleneck bij huidige row count**.

---

## Gekozen strategie: `split_or`

- Twee parallelle queries: `isActive:true` + `isActive:false` met paid-order EXISTS
- Merge op `createdAt` desc, dedup, `take` cap
- `whereExtras` (search, category, listingIntent) via `AND` — **fix** t.o.v. eerdere spread die visibility-OR kon overschrijven bij OFFER-filter

**Niet gekozen:**

- **IDs-first batch** (variant B uit spec) — extra roundtrip; alleen zinvol bij veel bredere selects
- **Aggressieve select-trim** — `FEED_PRODUCT_SELECT` al minimaal voor feed-transform; verder trim vereist tile consumer audit

---

## Validators

- `validate-feed-product-query-parity-phase3e.ts` ✅
- `validate-feed-contract-phase3a.ts` ✅

---

## Volgende stap (3E+)

1. Preview met `perfProbe=1` — meet Product bucket na deploy
2. Als Product > 800 ms warm: overweeg IDs-first + batch seller (P2) met parity tests
3. Geen Stripe-OR verwijderen zonder business sign-off
