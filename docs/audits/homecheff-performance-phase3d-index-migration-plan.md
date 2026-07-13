# Phase 3D — Dish Index Migratieplan

**Datum:** 2026-07-12  
**Branch:** `performance/phase2-baseline`  
**Status:** voorstel in schema + SQL — **geen migratie toegepast op preview/productie in deze sessie**

---

## 1. Migratievoorstel

### Prisma schema

```prisma
model Dish {
  // ...
  @@index([userId])
  @@index([status, createdAt(sort: Desc)])  // NIEUW — Phase 3D
}
```

Bestand: [prisma/schema.prisma](prisma/schema.prisma) (Dish model).

### Prisma CLI (development)

```bash
npx prisma migrate dev --name dish_status_created_at_feed_index
```

### Handmatige SQL (productie/preferred)

Bestand: [docs/audits/homecheff-performance-phase3d-migrations/20260712_dish_status_created_at_index.sql](docs/audits/homecheff-performance-phase3d-migrations/20260712_dish_status_created_at_index.sql)

```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Dish_status_createdAt_idx"
  ON "Dish" ("status", "createdAt" DESC);
```

---

## 2. Controlelijst

| Check | Resultaat |
|-------|-----------|
| Database provider | PostgreSQL (Neon) ✓ |
| Prisma versie | `sort: Desc` op composite index ondersteund ✓ |
| Bestaande Dish indexen | `Dish_pkey`, `Dish_userId_idx` |
| Duplicaat | Geen bestaande `(status, createdAt)` index |
| Migratienaam | `dish_status_created_at_feed_index` |
| Lock (CONCURRENTLY) | Geen blocking table lock op reads/writes |
| Schrijfoverhead | Laag — `createdAt` wijzigt zelden na publish |
| Rollback | `DROP INDEX CONCURRENTLY IF EXISTS "Dish_status_createdAt_idx"` |

### Tabelgrootte

- Dev: 22 rijen (niet representatief)
- Preview/productie: groter — seq scan + sort verklaart ~1,4 s Dish.findMany in 3C-preview

---

## 3. Stappenplan

### Stap 1 — Development / test

1. `npx prisma validate`
2. `npx prisma migrate dev --name dish_status_created_at_feed_index` (alleen op **niet-productie** DB)
3. `EXPLAIN ANALYZE` national dish query → verwacht Index Scan
4. Prisma Dish.findMany benchmark (5+ runs)

### Stap 2 — Previewdatabase

1. Review migratie-SQL
2. `CREATE INDEX CONCURRENTLY` op preview Neon branch
3. `npx prisma migrate deploy` indien migratiebestand in repo
4. Cache-bypass feed run: `?radius=0&scope=national&take=10` + `FEED_PERF_TIMING=1`
5. Target: Dish.findMany **< 700 ms** p50

### Stap 3 — Queryplan na index

1. `EXPLAIN (ANALYZE, BUFFERS)` op national dish SQL
2. Bevestig: geen Seq Scan op volledige Dish-tabel voor `status=PUBLISHED`
3. Rows scanned ≈ returned (early LIMIT 30)

### Stap 4 — Productie-uitrol

1. Maintenance window **niet** vereist (CONCURRENTLY)
2. Voer SQL uit via beheerde migratie (niet automatisch in deze fase)
3. Monitor Dish.findMany in `debug.perf` / Server-Timing
4. Target: Dish **< 700 ms**, server total p50 **< 3000 ms**

### Stap 5 — Rollback

```sql
DROP INDEX CONCURRENTLY IF EXISTS "Dish_status_createdAt_idx";
```

Prisma schema revert + nieuwe migratie indien nodig.

---

## 4. Wat **niet** is uitgevoerd (Phase 3D sessie)

- ❌ `prisma migrate dev` op gedeelde/preview/productie DB
- ❌ `CREATE INDEX` op preview of productie
- ❌ Commit / push / deploy

Schema-wijziging staat **lokaal uncommitted** als voorstel.

---

## 5. Go/no-go

| Stap | Besluit |
|------|---------|
| Code naar preview (schema + docs) | **GO** — veilig, geen runtime DB-wijziging tot migratie |
| Index op preview DB | **GO** met CONCURRENTLY + EXPLAIN validatie |
| Index op productie | **GO** na preview-meting Dish < 700 ms; anders **HOLD** |
