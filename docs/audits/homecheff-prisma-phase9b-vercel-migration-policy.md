# Phase 9B — Vercel Migration Policy

**Datum:** 2026-07-13  
**Status:** Onderzoek alleen — geen wijzigingen

---

## Huidige buildflow

| Component | Gedrag |
|-----------|--------|
| `vercel.json` | `buildCommand`: `node scripts/vercel-build.js` |
| `scripts/vercel-build.js` | 1) `prisma generate` 2) **`prisma migrate deploy`** 3) `next build` |
| Migratie-fout | **Graceful skip** — build gaat door |
| `package.json` `prebuild` | Alleen `prisma generate` (geen migrate) |
| `package.json` `build` | `next build` only |
| `DATABASE_URL` | Vercel env (shared Neon productie) |

### Risico huidige setup

- **Productie deploy kan migraties uitvoeren** zonder menselijke approval-stap
- Fail-soft maskeert echte migration failures
- Na archive: `migrate status` warnings in logs mogelijk; deploy zelf blijft werken voor pending

---

## Preview vs Production

| | Preview | Production |
|---|---------|------------|
| **Build script** | Zelfde `vercel-build.js` | Zelfde |
| **DATABASE_URL** | Vaak zelfde of preview branch DB | Shared Neon |
| **migrate deploy** | Ja (als env gezet) | Ja |
| **Baseline op lege preview** | **Gevaarlijk** als preview leeg en oude keten actief | N.v.t. |

---

## Aanbevolen beleid (ontwerp)

### 1. Geen automatische migrate in build

Vervang `vercel-build.js` stap 2 door:

```text
prisma generate → next build
```

Migraties via aparte **goedgekeurde** pipeline (GitHub Action handmatig / `workflow_dispatch`).

### 2. Expliciete approval

- Productie-migratie: ticket + `npm run db:migrate:shared` vanaf vertrouwde runner met `DATABASE_URL`
- Vercel deploy **na** bevestigde migration status

### 3. Baseline nooit op shared Neon

- Geen `db execute` baseline SQL in Vercel build
- Shared: alleen `migrate resolve --applied` voor baseline (eenmalig, handmatig)

### 4. Builds zonder verplichte migration

- `prisma generate` in `postinstall` / build — **voldoende** voor compile
- Schema/runtime mismatch alleen als pending migrations niet applied — detecteer via monitoring, niet silent skip

### 5. Fail-hard optie

Als migrate in build blijft: **geen** try/catch skip — failed migration = failed deploy.

---

## Phase 9B acties

| Actie | Status |
|-------|--------|
| `vercel-build.js` wijzigen | ❌ niet uitgevoerd |
| Vercel env audit | ❌ alleen documentatie |
| Deployment | ❌ |

---

## Tijdelijke mitigatie (tot buildfix)

- Geen nieuwe pending migrations op main tot beleid is afgehandeld
- Archive+promote eerst op branch; test disposable vóór merge
