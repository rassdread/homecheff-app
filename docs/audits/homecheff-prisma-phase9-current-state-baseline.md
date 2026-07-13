# Phase 9 — Current-State Greenfield Baseline

**Branch:** `performance/phase2-baseline`  
**Datum:** 2026-07-13  
**Strategie:** B — shared Neon ongemoeid; greenfield via current-state baseline

---

## Executive summary

| Item | Waarde |
|------|--------|
| Baselineversie | `20260713_current_state` |
| Cutoffdatum | **2026-07-13** |
| Voorgestelde migratienaam | `20260714_greenfield_current_state_baseline` |
| Staging-locatie | `prisma/baseline-staging/20260713_current_state/` |
| DDL-bron | `npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma` |
| SQL-grootte | ~114 KB |
| Modellen in schema | 93 |
| Enums in schema | 50 |
| System seed default | **geen** (sentinel optioneel, uitgecommentarieerd) |

**Belangrijk:** `prisma migrate deploy` op een **lege** database tegen de bestaande **70** mappen in `prisma/migrations/` is **verboden** — keten is niet greenfield-proof (Phase 8B bewijs).

---

## Gekozen architectuur (Deel 1)

### Opties vergeleken

| Criterium | Optie 1: `prisma/baseline/…` | Optie 2: Nieuwe migration map | Optie 3: SQL + bootstrap script |
|-----------|-------------------------------|------------------------------|--------------------------------|
| Raakt shared Neon | Nee | Alleen na promote | Nee |
| Prisma tooling | Gedeeltelijk | Volledig | Script + resolve |
| CI reproduceerbaar | Ja | Ja | Ja |
| Dubbele CREATE | Laag risico | Risico bij verkeerde deploy | Laag (expliciet pad) |
| Developer UX | Duidelijk pad | Verwarrend met 70 oude mappen | Duidelijk met docs |

### Besluit: **Optie 1 + 3 (hybrid)**

1. **Staging:** `prisma/baseline-staging/20260713_current_state/` — baseline SQL + seed + manifest (**niet actief**)
2. **Bootstrap:** `scripts/run-disposable-greenfield-test.ts` — past DDL toe + registreert **één** `_prisma_migrations`-rij
3. **Historische 70 mappen:** blijven in `prisma/migrations/` voor **shared Neon** referentie; greenfield **slaat ze over**
4. **Na promote (post-review):** kopieer naar `prisma/baseline/20260713_current_state/` en voeg `prisma/migrations/20260714_greenfield_current_state_baseline/` toe — **nog niet gedaan**

### Repositorystructuur

```
prisma/
  migrations/                    # 70 historische — SHARED NEON ONLY deploy path
  baseline-staging/
    20260713_current_state/      # Phase 9 STAGING (review)
      schema_baseline.sql
      system_seed.sql
      register_migration.sql
      manifest.json
      README.md
scripts/
  validate-current-state-baseline.ts
  run-disposable-greenfield-test.ts
docs/audits/
  homecheff-prisma-phase9-*.md
  homecheff-prisma-phase9-object-matrix.json
```

### Nieuwe databases

1. Gebruik **bootstrap script** (niet `migrate deploy` op 70 mappen)
2. `_prisma_migrations` bevat **alleen** baseline + post-cutoff migraties
3. `npx prisma migrate deploy` daarna voor **nieuwe** migraties na `20260714_…`

### Lineaire historie hervat

Vanaf **`20260714_greenfield_current_state_baseline`** — alle omgevingen voeren dezelfde **delta**-migraties uit die **na** cutoff worden toegevoegd.

---

## Deel 2 — Current-state schema

### Generatiemethode (read-only)

```bash
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/baseline-staging/20260713_current_state/schema_baseline.sql
```

### Kritieke objecten — aanwezig in baseline

| Object | Status |
|--------|--------|
| Alle 93 Prisma-modellen | ✅ |
| Alle 50 enums | ✅ |
| `Dish_status_createdAt_idx` | ✅ |
| `Product.lengthCm/widthCm/heightCm/weightKg` | ✅ |
| `PromoCode.affiliateId` nullable + `sellerId` | ✅ |
| `AdminPermissions` + 15 tab-kolommen incl. `canViewVariabelenTab` | ✅ |
| `AdminPreferences` | ✅ |
| `DeliveryProfile.gpsTrackingEnabled` / `isOnline` | ✅ |
| Affiliate / trust / marketplace / community-order | ✅ |
| `ConversationKey`, auth (`Account`, `Session`) | ✅ |

### Niet-Prisma objecten

| Object | Classificatie | Notitie |
|--------|---------------|---------|
| PostgreSQL extensions | E | Geen in baseline; verifieer live indien nodig |
| Views / triggers / functions | D | Geen in 70 migraties gevonden |
| Partial / expression indexes | B | Alleen Prisma-gedefinieerde indexes |
| Loose SQL (`add_delivery_online_status.sql` etc.) | D/A | Inhoud al in `schema.prisma` diff |

Volledige matrix: [`homecheff-prisma-phase9-object-matrix.json`](./homecheff-prisma-phase9-object-matrix.json)

---

## Deel 3 — System seed

Zie: [`homecheff-prisma-phase9-system-seed.md`](./homecheff-prisma-phase9-system-seed.md)

**Advies unassigned sentinel:** **niet opnemen** in standaard greenfield (app gebruikt `deliveryProfileId = null`). Optioneel via `--include-sentinel` in testscript.

---

## Deel 4 — Prisma history bootstrap

Zie: [`homecheff-prisma-phase9-bootstrap-strategy.md`](./homecheff-prisma-phase9-bootstrap-strategy.md)

---

## Deel 5 — Validators

```bash
npx tsx scripts/validate-current-state-baseline.ts
npx tsx scripts/analyze-prisma-migration-dependencies.ts  # dependency validator
```

---

## Deel 8 — Oude baseline-pack (8 mappen)

| Migratie | Besluit |
|----------|---------|
| Alle 8 `202602*` gereconstrueerde mappen | **Verplaatsen naar `docs/baseline-history/phase8-reconstructed/`** — auditmateriaal |
| Actieve `prisma/migrations/` keten | **Niet uitbreiden** met checksum-afwijkende reconstructies |
| Shared Neon | Records blijven in `_prisma_migrations`; geen resolve |
| Greenfield | Inhoud al in `schema_baseline.sql` — aparte historische mappen overbodig |

**Niet verwijderen uit Git-history** zonder review; wel **niet promoten** naar actieve keten vóór greenfield GO.

---

## Validatie (lokaal, read-only)

| Check | Resultaat |
|-------|-----------|
| `npx prisma format` | ✅ |
| `npx prisma validate` | ✅ |
| `npx prisma generate` | ✅ |
| `npm run lint` | ✅ |
| `npm run build` | ✅ |
| `npm run smoke-check` | ✅ |
| `validate-current-state-baseline.ts` | ✅ 93/93 models, 50/50 enums, 258 indexes |
| `analyze-prisma-migration-dependencies.ts` | ✅ (70 mappen; 25 forward-ref risks gedocumenteerd) |
| `run-disposable-greenfield-test.ts` | ✅ dry-run plan geschreven |

---

## GO / HOLD

| Onderdeel | Besluit |
|-----------|---------|
| Baseline commit (staging) | **GO** na review |
| Disposable DB-test | **HOLD** — expliciete toestemming |
| Merge → main | **HOLD** |
| `migrate deploy` shared Neon | **HOLD** (niets pending) |
| Nieuwe developer onboarding | **HOLD** tot disposable test GO |

Zie: [`homecheff-prisma-phase9-greenfield-test-plan.md`](./homecheff-prisma-phase9-greenfield-test-plan.md)
