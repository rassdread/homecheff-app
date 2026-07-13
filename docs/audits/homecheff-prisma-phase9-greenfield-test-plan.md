# Phase 9 — Disposable Greenfield Test Plan

**Status:** voorbereid — **niet uitgevoerd** in Phase 9  
**Script:** `scripts/run-disposable-greenfield-test.ts`

---

## Doel

Bewijzen dat `schema_baseline.sql` een lege PostgreSQL-database naar **schema ≡ prisma/schema.prisma** brengt, zonder de 70 historische migraties.

---

## Preconditions

| # | Vereiste |
|---|----------|
| 1 | Disposable Neon branch of lokale Postgres |
| 2 | `DATABASE_URL` **niet** shared Neon (`ep-summer-darkness-a2l0745u` geblokkeerd in script) |
| 3 | `GREENFIELD_TEST_ACK=I_UNDERSTAND_DISPOSABLE` |
| 4 | `npx tsx scripts/validate-current-state-baseline.ts` passed |
| 5 | Expliciete menselijke GO voor DB-test |

---

## Testflow

```
┌─────────────────────────┐
│ Disposable lege DB      │
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ Hostname safety check   │──► ABORT bij prod/shared pattern
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ Assert 0 public tables  │──► ABORT bij bestaande data
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ schema_baseline.sql     │
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ system_seed (optional)  │
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ register_migration.sql  │
│ + baseline checksum row │
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ prisma generate         │
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ migrate diff → schema   │──► verwacht leeg of acceptabel
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ build + smoke-check     │
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ Minimal CRUD tests      │
│ User, Product, Promo,   │
│ DeliveryProfile, Dish   │
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ JSON report in docs/    │
│ audits/                 │
└─────────────────────────┘
```

---

## Commando's

### Dry-run (default — geen DB)

```bash
npx tsx scripts/run-disposable-greenfield-test.ts
```

Output: `docs/audits/greenfield-test-plan-dry-run-*.json`

### Execute (disposable only)

```bash
export DATABASE_URL="postgresql://..."
export DIRECT_URL="$DATABASE_URL"
export GREENFIELD_TEST_ACK=I_UNDERSTAND_DISPOSABLE

npx tsx scripts/run-disposable-greenfield-test.ts --execute
```

### Varianten

```bash
# Historische sentinel compat test:
npx tsx scripts/run-disposable-greenfield-test.ts --execute --include-sentinel

# Opruimen na test:
npx tsx scripts/run-disposable-greenfield-test.ts --execute --cleanup
```

---

## Verwachte failures (als baseline incompleet)

| Fase | Symptoom | Oorzaak |
|------|----------|---------|
| DDL apply | `relation already exists` | DB niet leeg |
| DDL apply | `type does not exist` | Volgorde in SQL (zeldzaam bij migrate diff) |
| Schema diff | `ADD COLUMN` statements | Baseline ≠ schema.prisma |
| CRUD | FK violation | Ontbrekende defaults / verplichte relaties |
| CRUD | `column does not exist` | Schema drift |

---

## Acceptabele diff-verschillen

| Verschil | Acceptabel? |
|----------|-------------|
| `HcpCarouselSlide.updatedAt` default | ✅ introspection noise (Phase 6) |
| Extension niet in Prisma | ✅ indien gedocumenteerd |
| Ontbrekende kolom/index | ❌ baseline fix vereist |

---

## Rapportage

Script schrijft:

- `docs/audits/greenfield-test-report-<timestamp>.json`
- Bevat: stappen, diff preview, CRUD ids, pass/fail

---

## Geen destructive fallback

- Script **weigert** onbekende/productie databases
- Geen `migrate reset` zonder `--cleanup` op expliciet disposable URL
- Geen automatische reset bij mislukte test — handmatig onderzoek

---

## GO criteria na test

| Criterium | Vereist |
|-----------|---------|
| Schema diff leeg of acceptabel | ✅ |
| build + smoke-check pass | ✅ |
| CRUD tests pass | ✅ |
| Rapport gearchiveerd | ✅ |

Dan: **GO** voor baseline promote + developer onboarding docs.
