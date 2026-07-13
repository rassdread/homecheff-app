# Phase 3E — Dish Query Analysis

**Datum:** 2026-07-13  
**Module:** `lib/feed/feed-dish-query.server.ts`  
**Default strategy:** `trimmed_user`

---

## Huidige query

```typescript
where: { status: 'PUBLISHED', id: { notIn: linkedProductIds }, ... }
orderBy: createdAt desc
take: FEED_DB_DISH_CAP (30)
select/include: user (12 velden), photos { idx }, videos { url, thumbnail } take 1
```

---

## Varianten (lokaal, 22 published dishes)

| Variant | p50 ms | Rows | ID parity |
|---------|--------|------|-----------|
| `include_full` | 647 | 22 | ref |
| `trimmed_user` | 712 | 22 | ✅ identical |

`trimmed_user` gebruikt `select` i.p.v. `include` — zelfde velden, marginale verschil lokaal.

---

## Index

**Aanwezig:** `Dish_status_createdAt_idx` ✅

**EXPLAIN (22 rows):**

```
Seq Scan on "Dish"  Filter: status = 'PUBLISHED'
Sort Key: createdAt DESC
Execution Time: 0.051 ms
```

**Conclusie:** bij huidige tabelgrootte gebruikt Postgres seq scan + sort — index **niet geselecteerd** omdat tabel te klein is. Geen nieuwe index zonder EXPLAIN op productie-rowcount.

---

## Productie (homecheff.eu)

| Run | dbDishMs |
|-----|----------|
| Cold | **1410** |
| Warm | **949–973** |

Hoofdoorzaak: zelfde als Product — **Vercel↔Neon RTT** + user-relation per dish.

---

## Phase 3E optimalisatie: parallel metadata

**Vóór:** `loadDishPhotoMetadata(allIds)` sequentieel na dish+linked queries  
**Na:** `loadDishPhotoMetadata(linkedIdsNeedingDonor)` parallel met `dishQuery`; daarna alleen published-only IDs

Verwachte wall-clock winst op productie: **200–500 ms** wanneer metadata en dish query overlappen.

---

## Validators

- `validate-feed-dish-query-parity-phase3e.ts` ✅
- `validate-feed-dish-index-phase3d.ts` ✅ (ongewijzigd)
