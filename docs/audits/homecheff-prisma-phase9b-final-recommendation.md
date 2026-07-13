# Phase 9B — Final Recommendation & GO/HOLD

**Branch:** `performance/phase2-baseline`  
**Datum:** 2026-07-13  
**Prisma:** 6.16.2

---

## 1. Prisma-versie en officiële mogelijkheden

Zie `homecheff-prisma-phase9b-dual-track-architecture.md` DEEL 1.

**Kern:** Eén `migrations.path` per CLI-aanroep; dual-track via **archief + actieve root** (primair) of **twee `prisma.config.ts` bestanden** (fallback).

---

## 2. Vergelijking opties A–E

Zie `homecheff-prisma-phase9b-option-matrix.json` en simulatiedoc.

| Optie | Aanbeveling |
|-------|-------------|
| **A** Archive + baseline root | **Primair** |
| **B** Dual prisma config | Fallback |
| **C** Bootstrap + resolve | Onderdeel van greenfield flow |
| **D** Migration package | Afwijzen |
| **E** History cutover | **Verboden** |

---

## 3. Definitieve architectuur

**Optie A — Archive pre-cutoff, single active migration root**

| Element | Waarde |
|---------|--------|
| Archive | `prisma/migrations-archive/pre-20260714-greenfield/` |
| Active root | `prisma/migrations/` |
| Baseline | `20260714_greenfield_current_state_baseline` |
| Schema | `prisma/schema.prisma` (enige client) |
| Shared Neon | Behoud 72 `_prisma_migrations` records; geen baseline DDL |
| Greenfield | `migrate deploy` op lege DB na promote |

**Fallback:** Optie B met `prisma.config.greenfield.ts` (`migrations.path: prisma/migrations-greenfield`) tot archive klaar is.

---

## 4. Shared Neon simulatie

Zie `homecheff-prisma-phase9b-shared-neon-simulation.md`.

- Huidige status: **up to date** (62 local / 72 DB)
- Na archive: **applied-but-missing** verwacht — **veilig**
- Deploy nieuwe post-cutoff: **werkt**

---

## 5. Greenfield bootstrap

Zie `homecheff-prisma-phase9b-greenfield-bootstrap-flow.md`.

Script: `run-disposable-greenfield-test.ts` met `--mode dry-run|greenfield`.

---

## 6. Cutoff policy

| Regel | Waarde |
|-------|--------|
| **Cutoff datum** | 2026-07-13 |
| **Baseline naam** | `20260714_greenfield_current_state_baseline` |
| **Eerste post-cutoff** | Eerste nieuwe folder met naam **>** baseline (bijv. `20260715_add_dish_reviews` na hernoemen) |
| **Naming** | `^20[0-9]{12}_[a-z0-9_]+$` |
| **Data migrations** | Expliciete `migration.sql` stappen; geen productiedata in baseline |
| **Raw SQL** | Toegestaan in migraties; baseline = `migrate diff` output |
| **CONCURRENTLY** | **Verboden** in Prisma migrate-transactie — gebruik non-concurrent of runbook |

**Validator:** `scripts/validate-migration-cutoff.ts`
- Default: warn pre-cutoff in active (pre-promote)
- `--strict`: fail — voor CI na promote

---

## 7. CI / developer workflow

Zie `homecheff-prisma-phase9b-ci-developer-workflow.md`.

---

## 8. Vercel

Zie `homecheff-prisma-phase9b-vercel-migration-policy.md`.

**Aanbeveling:** Verwijder auto-`migrate deploy` uit `vercel-build.js`; migrate via goedgekeurde pipeline.

---

## 9. Toolingwijzigingen (lokaal, niet gecommit)

| Bestand | Actie |
|---------|-------|
| `prisma/migration-tracks.config.json` | Nieuw |
| `scripts/validate-migration-cutoff.ts` | Nieuw |
| `scripts/validate-dual-track-migration-config.ts` | Nieuw |
| `scripts/simulate-shared-neon-migration-options.ts` | Nieuw |
| `scripts/run-disposable-greenfield-test.ts` | Phase 9B modes + validators |
| `scripts/validate-disposable-greenfield-safety.ts` | Uitgebreid |
| `package.json` | `db:*` npm scripts |

---

## 10. Validatieresultaten

| Check | Resultaat |
|-------|-----------|
| `npx prisma format` | ✅ |
| `npx prisma validate` | ✅ |
| `npx prisma generate` | ✅ |
| `npm run lint` | ✅ |
| `npm run build` | ✅ |
| `npm run smoke-check` | ✅ |
| `validate-current-state-baseline.ts` | ✅ 93 models / 258 indexes |
| `validate-disposable-greenfield-safety.ts` | ✅ (61 pre-cutoff verwacht) |
| `validate-migration-cutoff.ts` (warn) | ✅ met warnings |
| `validate-migration-cutoff.ts --strict` | ❌ **verwacht** — 61 pre-cutoff tot archive |
| `validate-dual-track-migration-config.ts` | ✅ met promote-warn |
| `analyze-prisma-migration-dependencies.ts` | ✅ 62 migrations, 20 risky |
| `simulate-shared-neon-migration-options.ts` | ✅ → `phase9b-simulation-latest.json` |
| `run-disposable-greenfield-test.ts` dry-run | ✅ plan geschreven |
| Secrets scan baseline staging | ✅ alleen `passwordHash` kolomnaam |
| Live `migrate status` (read-only) | ✅ up to date |

---

## 11. GO / HOLD

| Onderwerp | Besluit |
|-----------|---------|
| **Architectuurcommit** (docs + tooling) | **GO** — na review van Phase 9B deliverables |
| **Historische migraties archiveren** | **HOLD** — aparte promote-stap + menselijke GO |
| **Disposable database test** | **HOLD** — na archive + `GREENFIELD_*` |
| **Developer onboarding** | **HOLD** — na disposable GO |
| **Merge naar main** | **HOLD** |
| **Shared Neon migrate deploy** | **HOLD** — niets pending; nooit baseline DDL |

---

## 12. Bevestiging Phase 9B

| Actie | Status |
|-------|--------|
| Database mutatie | ❌ |
| Git commit | ❌ |
| Git push | ❌ |
| Merge | ❌ |
| Deployment | ❌ |
| Alleen read-only analyse + lokale tooling | ✅ |
