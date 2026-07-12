# Phase 3C — Index Proposal (geen migratie)

**Datum:** 2026-07-12  
**Status:** voorstel only — **geen migratie uitgevoerd**

---

## Dish — `(status, createdAt DESC)`

### Schema wijziging

```prisma
model Dish {
  // ... bestaande velden ...
  @@index([userId])
  @@index([status, createdAt(sort: Desc)])  // NIEUW
}
```

### Query die index gebruikt

```typescript
prisma.dish.findMany({
  where: { status: 'PUBLISHED', /* optional notIn, bbox */ },
  orderBy: [{ createdAt: 'desc' }],
  take: 30,
})
```

**Verwacht plan:** Index Scan op `(status, createdAt)` i.p.v. filter + sort.

### Bewijs

- Huidige schema: alleen `@@index([userId])` — [prisma/schema.prisma](prisma/schema.prisma) regel ~1330
- National feed: `status=PUBLISHED`, geen userId filter, `ORDER BY createdAt DESC`
- Preview: Dish.findMany **~1422 ms** gemiddeld

### Risico

| Factor | Inschatting |
|--------|-------------|
| Schrijfoverhead | Laag — createdAt wijzigt zelden na publish |
| Rollback | Index drop via migratie revert |
| Conflict | Geen met bestaande userId index |

---

## Dish — optioneel `(status, lat, lng)`

Alleen toevoegen als bbox-filtering op national+geo feed dominant blijft na Dish index #1 meting.

```prisma
@@index([status, lat, lng])
```

**Risico:** hogere schrijfoverhead bij locatie-updates.

---

## Product — bestaande index voldoende

`@@index([isActive, createdAt(sort: Desc)])` **bestaat al**.

3C latency was primair **Image byte payload**, niet ontbrekende index.

### Optioneel toekomstig

```prisma
@@index([isActive, listingIntent, createdAt(sort: Desc)])
```

Alleen als `listingIntent` filter dominant wordt in EXPLAIN.

---

## Migratie prompt (later)

```
Phase 3C-DB: Add Dish (status, createdAt) index
- npx prisma migrate dev --name dish_status_created_at_feed_index
- Valideer EXPLAIN op national feed Dish.findMany
- Target: Dish.findMany < 800 ms
```

---

## Product Image — geen index nodig

Metadata via raw SQL op `Image.productId` — bestaande `@@index([productId, sortOrder])` volstaat.
