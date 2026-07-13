# Phase 9A — Baseline Safety Review

**Branch:** `performance/phase2-baseline`  
**Datum:** 2026-07-13  
**Methode:** read-only review + lokale validatie (geen DB-writes, geen disposable test)

---

## Executive summary

| Onderwerp | Resultaat |
|-----------|-----------|
| Handmatige `_prisma_migrations` INSERT | **Verwijderd** — vervangen door `migrate resolve --applied` flow |
| Migration root | **Optie C** (archive pre-cutoff) + baseline-only deploy |
| Baseline SQL | **93/93 modellen**, 50 enums, 258 indexes — validator pass |
| Prisma vs live Neon | **1 acceptabel verschil** (`HcpCarouselSlide.updatedAt`) |
| System seed | **Leeg standaard** — geen harde rij-vereisten gevonden |
| Disposable script | **Gehard** — `GREENFIELD_DATABASE_URL`, geen `.env.local` |
| Phase 8 mappen | **Verplaatst** uit actieve keten naar `docs/baseline-history/` |

---

## Deel 1 — Vervanging handmatige `_prisma_migrations` insert

### Was (Phase 9 — onveilig)

- `register_migration.sql` met `CREATE TABLE _prisma_migrations` + `INSERT`
- Testscript schreef checksum handmatig via `$executeRaw`

### Nu (Phase 9A — officieel)

| Stap | Tool | SQL uitgevoerd? |
|------|------|-----------------|
| 1 | `prisma db execute --file schema_baseline.sql` | ✅ DDL |
| 2 | `prisma migrate resolve --applied 20260714_greenfield_current_state_baseline` | ❌ alleen history |
| 3 | `prisma migrate deploy` | Alleen post-cutoff pending |

**Alternatief (preferred na promote):** lege DB + alleen baseline-map in `prisma/migrations/` → `migrate deploy` draait baseline `migration.sql` één keer (checksum automatisch).

Documentatie: [`register_migration.sql`](../../prisma/baseline-staging/20260713_current_state/register_migration.sql) (geen INSERT meer).

---

## Deel 2 — Actieve migration root

**Gekozen: Optie C** — archiveer pre-cutoff buiten actieve `prisma/migrations/`.

| Optie | Besluit |
|-------|---------|
| A — aparte Prisma config | ❌ Prisma 6.16 heeft geen `migrations` path in schema |
| B — apart package | ❌ DX te zwaar |
| **C — archive + baseline-only active** | ✅ |
| D — resolve 61× zonder archive | ❌ fragiel, geen deploy-veiligheid |

### Promote-stappen (nog niet uitgevoerd)

1. `git mv prisma/migrations/*` → `prisma/migrations-archive/pre-20260714-greenfield/` (behalve `migration_lock.toml`)
2. Kopieer `promote-to-migrations/20260714_greenfield_current_state_baseline/` → `prisma/migrations/`
3. Shared Neon eenmalig: `migrate resolve --applied 20260714_greenfield_current_state_baseline`

### Huidige staat (pre-promote)

- **61** pre-cutoff migraties nog in `prisma/migrations/`
- **8** Phase-8 reconstructies → `docs/baseline-history/phase8-reconstructed/`
- `--execute` **weigert** tot archive compleet is

---

## Deel 3 — Baseline SQL review

Bron: `schema_baseline.sql` (114 095 bytes, checksum `834d5d1b…`)

| Check | Status |
|-------|--------|
| 93 modellen | ✅ validator |
| 50 enums | ✅ |
| 258 indexes | ✅ |
| FKs / nullability / defaults | ✅ via Prisma diff generator |
| `Dish_status_createdAt_idx` | ✅ regel ~2311 in SQL |
| Product dimensies | ✅ `lengthCm` etc. |
| PromoCode nullable affiliate + sellerId | ✅ |
| `PromoCode_sellerId_idx` + FK | ✅ |
| AdminPermissions tab-kolommen (15) | ✅ incl. `canViewVariabelenTab` |
| `User.passwordHash` | ✅ |
| `UserRole` SUPERADMIN | ✅ |
| Delivery / courier / trust / affiliate | ✅ |
| Destructive statements | ✅ geen DROP/TRUNCATE/DELETE |
| Secrets / PII in DDL | ✅ geen |

---

## Deel 4 — Prisma vs baseline vs live Neon

| Bron | Rol |
|------|-----|
| `schema.prisma` | Autoritatief model |
| `schema_baseline.sql` | `migrate diff --from-empty` → **match 93/93** |
| Live shared Neon | Read-only `migrate diff` |

**Live diff (read-only, 2026-07-13):**

```sql
ALTER TABLE "public"."HcpCarouselSlide" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
```

**Besluit:** geaccepteerd introspection noise (Phase 6). Geen schema-wijziging vereist.

Objectmatrix: [`homecheff-prisma-phase9-object-matrix.json`](./homecheff-prisma-phase9-object-matrix.json)

---

## Deel 5 — System seed

Standaard **leeg** — geen idempotente systeemrecords vereist.

| Item | Vereist? | Bewijs |
|------|----------|--------|
| Sentinel user/profile | Nee | Phase 7; app `null` |
| Admin/Badge/Plan rows | Nee | `badge.upsert` on demand |
| Taxonomy / feature flags | Nee | geen hard FK in code |

Zie: [`homecheff-prisma-phase9-system-seed.md`](./homecheff-prisma-phase9-system-seed.md)

---

## Deel 6 — Disposable script

Zie: [`homecheff-prisma-phase9a-disposable-readiness.md`](./homecheff-prisma-phase9a-disposable-readiness.md)

Validator: `scripts/validate-disposable-greenfield-safety.ts` ✅

---

## Validatie

| Check | Resultaat |
|-------|-----------|
| `npx prisma format` | ✅ |
| `npx prisma validate` | ✅ |
| `npx prisma generate` | ✅ |
| `npm run lint` | ✅ |
| `npm run build` | ✅ |
| `npm run smoke-check` | ✅ |
| `validate-current-state-baseline.ts` | ✅ |
| `validate-disposable-greenfield-safety.ts` | ✅ |
| `analyze-prisma-migration-dependencies.ts` | ✅ |
| SQL static analysis (baseline validator) | ✅ |
| Secrets scan baseline | ✅ |

---

## Gewijzigde bestanden (Phase 9A)

- `prisma/baseline-staging/20260713_current_state/register_migration.sql` — geen INSERT
- `prisma/baseline-staging/.../promote-to-migrations/` — baseline preview
- `scripts/run-disposable-greenfield-test.ts` — gehard
- `scripts/validate-disposable-greenfield-safety.ts` — nieuw
- `docs/baseline-history/phase8-reconstructed/` — 8 mappen verplaatst
- `prisma/migrations/202602*` — **verwijderd** uit actieve keten
