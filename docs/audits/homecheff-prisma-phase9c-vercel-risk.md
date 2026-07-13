# Phase 9C — Vercel Buildflow Risk

**Huidige staat:** `scripts/vercel-build.js` → `prisma generate` → **`prisma migrate deploy`** (fail-soft) → `next build`

---

## Scenario: archive-promote live, baseline niet resolved

| Stap | Wat gebeurt |
|------|-------------|
| 1 | Vercel build start met nieuwe code (baseline-only migrations root) |
| 2 | `migrate deploy` ziet pending `20260714_greenfield_current_state_baseline` |
| 3 | Voert baseline DDL uit op **shared Neon** |
| 4 | **Faalt** op `CREATE TABLE` duplicate / bestaande objecten |
| 5 | catch → "Migrations skipped" → **build gaat door** |
| 6 | App deployed met **inconsistente** migration state (baseline niet applied in `_prisma_migrations`) |

### Risico's

| Risico | Ernst |
|--------|-------|
| Fail-soft verbergt migration failure | **Hoog** |
| Baseline DDL op productie | **Kritiek** (gelukkig meestal fail, niet idempotent overal) |
| Preview = Production DB | **Hoog** als zelfde `DATABASE_URL` |
| Parallelle builds | Race: dubbele deploy-pogingen |

---

## Bewijs uit cutover-simulatie

Zonder resolve verschijnt baseline als **"not yet been applied"** — `migrate deploy` **zal** deze uitvoeren.

---

## Veilige cutovervolgorde (afwijking t.o.v. 9B)

```
1. Vercel policy     → migrate deploy UIT build (fail-hard of verwijderd)
2. Tooling/docs      → Phase 9B/9C validators (klaar)
3. DB backup         → Neon PITR + schema diff snapshot
4. Archive-promote   → git commit (62→archive, baseline→active, loose SQL→archive)
   ⛔ STOP — geen Vercel deploy tot stap 5-6 klaar
5. Baseline resolve  → migrate resolve --applied (handmatig, shared Neon)
6. migrate status    → baseline applied; applied-but-missing OK
7. Greenfield test   → disposable --mode greenfield
8. Merge main        → alleen na greenfield GO
9. Controlled deploy → expliciete migration check vóór build
```

**Waarom resolve na promote:** `migrate resolve` vereist dat baseline-folder in actieve `prisma/migrations/` staat.

**Waarom Vercel vóór promote:** anders triggert elke build baseline DDL op shared.

---

## Aanbevolen Vercel-wijziging (nog niet uitgevoerd)

```javascript
// vercel-build.js — verwijder migrate deploy stap
execSync('npx prisma generate', ...);
execSync('next build', ...);
```

Migraties via handmatige `npm run db:migrate:shared` met approval.

---

## GO/HOLD Vercel policy

| | |
|---|---|
| **HOLD** | Wijziging vereist **vóór** archive-promote deploy |
| **GO** | Na review + merge policy-commit |
