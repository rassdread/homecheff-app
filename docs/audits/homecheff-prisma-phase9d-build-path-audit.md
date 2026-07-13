# Phase 9D — Build Path Audit

**Datum:** 2026-07-13  
**Scope:** Repository-brede zoektocht naar automatische migraties in build/CI-paden

---

## Actieve Vercel-pad (vóór → na)

| Bestand | Vóór 9D | Na 9D |
|---------|---------|-------|
| `vercel.json` | `node scripts/vercel-build.js` | ongewijzigd |
| `scripts/vercel-build.js` | generate + **migrate deploy (fail-soft)** + next build | generate + next build |
| `scripts/build.js` | wrapper → `vercel-build.js` | ongewijzigd (erf nieuw gedrag) |
| `package.json` `build` | next build only | ongewijzigd |
| `package.json` `prebuild` | prisma generate | ongewijzigd |
| `package.json` `postinstall` | prisma generate | ongewijzigd |
| `package.json` `build:full` | `node scripts/vercel-build.js` | erft 9D (geen migrate) |

---

## Gevonden migratiepaden

### Kritiek — was actief op Vercel (opgelost in 9D)

| Pad | Commando | Status |
|-----|----------|--------|
| `scripts/vercel-build.js` | `npx prisma migrate deploy` + catch | **VERWIJDERD** |

### Expliciet handmatig (toegestaan)

| Pad | Commando |
|-----|----------|
| `package.json` `db:migrate:shared` | migrate deploy + approval echo |
| `package.json` `db:migrate:greenfield` | migrate deploy + greenfield echo |
| `scripts/run-disposable-greenfield-test.ts` | deploy/execute (greenfield only, ACK-gated) |

### Legacy — niet op Vercel-pad (waarschuwing)

| Pad | Opmerking |
|-----|-----------|
| `package.json` `build:vercel-old` | `migrate deploy \|\| echo OK` — legacy referentie |
| `scripts/build.sh` | bash alternatief met migrate deploy — niet in `vercel.json` |
| `scripts/update-vercel-build-command.js` | API helper met oude migrate-command |

### CI

| Pad | Build stap | Migraties |
|-----|------------|-----------|
| `.github/workflows/deploy.yml` | `npm run build` | **Geen** migrate deploy |

### Documentatie / audits

Diverse `docs/audits/*` en plan-JSON — geen runtime impact.

---

## Zoekpatronen gebruikt

- `prisma migrate deploy`
- `prisma migrate resolve`
- `prisma db push`
- `prisma db execute`
- `migrate deploy`
- `vercel-build`

---

## Validator

`scripts/validate-no-auto-migrations-in-build.ts` — faalt bij migratie-ref in actieve build-paden.
