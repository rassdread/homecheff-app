# Phase 9B — CI & Developer Workflow

---

## npm scripts

| Script | Omgeving | Config | Migration root | Muterend | CI | Developer |
|--------|----------|--------|----------------|----------|-----|-----------|
| `npm run validate:baseline` | — | — | staging | ❌ | ✅ PR | Lokaal |
| `npm run validate:greenfield-safety` | — | — | — | ❌ | ✅ PR | Lokaal |
| `npm run validate:migration-cutoff` | — | `migration-tracks.config.json` | `prisma/migrations` | ❌ | ✅ warn | Lokaal |
| `npm run db:migration:validate` | — | config | active + archive layout | ❌ | ✅ **strict** na promote | Pre-commit |
| `npm run validate:dual-track` | — | config | beide paden | ❌ | ✅ PR | Lokaal |
| `npm run db:simulate:shared-neon` | — | inventory | simulatie | ❌ | optioneel | Architectuur |
| `npm run db:greenfield:bootstrap` | disposable plan | greenfield track | rapporteert root | ❌ | ✅ dry-run | Onboarding prep |
| `npm run db:greenfield:test` | disposable | `GREENFIELD_*` | active | ✅ | ❌ handmatig | Na GO |
| `npm run db:migrate:shared` | shared Neon | `DATABASE_URL` | `prisma/migrations` | ✅ | ❌ **nooit auto** | Expliciet + approval |
| `npm run db:migrate:greenfield` | disposable | `GREENFIELD_DATABASE_URL` | active | ✅ | ❌ | Test only |
| `npm run build` | any | — | — | ❌ DB | ✅ | Lokaal |
| `npm run smoke-check` | any | — | — | ❌ DB | ✅ | Lokaal |

**Regel:** `build` en `prebuild` voeren **geen** `migrate deploy` uit — alleen `prisma generate`.

---

## Developer dagelijks

### Normaal schema-wijziging

1. `npx prisma migrate dev --name 20260715_feature_x` (lokaal dev DB)
2. `npm run db:migration:validate` (na promote: strict)
3. PR → CI validators

### Nieuwe clone / greenfield test-DB

1. **Nooit** `migrate deploy` op lege DB tegen 62 historische folders
2. Wacht op archive+promote OF gebruik disposable script
3. `npm run db:greenfield:bootstrap` (dry-run plan)

### Shared Neon

1. **Nooit** baseline SQL / `db execute` op productie
2. Migraties via goedgekeurde `db:migrate:shared` na merge
3. Verwacht `applied-but-missing` na archive — zie simulatiedoc

---

## CI pipeline (aanbevolen)

```yaml
# Conceptueel — niet geïmplementeerd in Phase 9B
jobs:
  prisma-validate:
  - npx prisma validate
  - npm run validate:baseline
  - npm run validate:greenfield-safety
  - npm run validate:dual-track
  - npm run validate:migration-cutoff        # warn pre-promote
  - npm run db:greenfield:bootstrap          # dry-run
  build:
  - npm run lint
  - npm run build          # geen migrate
  - npm run smoke-check
```

Na archive-promote: voeg `npm run db:migration:validate` toe (strict).

---

## Config-bestand

`prisma/migration-tracks.config.json` — single source of truth voor paden, cutoff, blocked hosts.

---

## Verboden zonder expliciete GO

- `migrate deploy` op shared in CI
- `migrate reset` op shared
- Handmatige `INSERT`/`DELETE` in `_prisma_migrations`
