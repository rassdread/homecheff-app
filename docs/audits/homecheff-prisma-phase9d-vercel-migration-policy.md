# Phase 9D — Vercel Migration Policy (enforced)

**Branch:** `performance/phase2-baseline`  
**Datum:** 2026-07-13  
**Status:** Geïmplementeerd in `scripts/vercel-build.js`

---

## Beleid

| Omgeving | Migraties tijdens build |
|----------|-------------------------|
| **Vercel Preview** | **Nee** |
| **Vercel Production** | **Nee** |
| **Lokale `npm run build`** | **Nee** (alleen `prisma generate` via `prebuild`) |

### Vercel buildflow (actief)

```
prisma generate → next build
```

Logregel bij elke Vercel build:

> Database migrations are managed by an explicit approved pipeline and are not run during Vercel builds.

### Database-uitrol (expliciet, handmatig)

| Script | Doel | Wanneer |
|--------|------|---------|
| `npm run db:migrate:shared` | `migrate deploy` op shared Neon | Na menselijke GO + `DATABASE_URL` |
| `npm run db:migrate:greenfield` | Disposable greenfield | `GREENFIELD_DATABASE_URL` only |
| `npm run db:migration:validate` | Cutoff + dual-track strict | CI / pre-promote |

### Verboden in build-paden

- `prisma migrate deploy`
- `prisma migrate resolve`
- `prisma db push` / `db execute`
- Fail-soft migratiecatch die build laat doorgaan na DDL-fout

### Cutover-context

- **Baseline** wordt nooit automatisch op shared Neon uitgevoerd
- **Archive-promote** volgt apart runbook (Phase 9C)
- Mislukte migration in goedgekeurde job → fix-forward; **app-build blijft onafhankelijk**

### Validatie

```bash
npm run validate:no-auto-migrations-in-build
```

---

## Niet in scope (Phase 9D)

- GitHub Action migration pipeline (ontwerp alleen)
- Archive-promote
- Baseline resolve
- Merge naar main
