# Phase 9 — Shared Neon Policy

**Database:** Neon PostgreSQL shared (endpoint `ep-summer-darkness-a2l0745u` — geen credentials in dit document)  
**Strategie:** B — **geen wijzigingen** aan bestaande migratiehistorie

---

## Vast beleid

| Regel | Status |
|-------|--------|
| Huidige `_prisma_migrations` behouden | ✅ **72 records** onaangeroerd |
| 8 database-only records | ✅ Blijven; namen matchen nu lokaal (Phase 8 staging) |
| 28 checksum-mismatches | ✅ Gedocumenteerd; **geen resolve** voor cosmetische gelijkheid |
| Phase 9 baseline SQL | ❌ **Niet** uitvoeren op shared Neon |
| `migrate deploy` nu | ❌ Niet nodig (`migrate status` = up to date) |
| `migrate resolve` bulk | ❌ Verboden zonder deploy-fout + backup |
| `db push` / `reset` | ❌ Verboden |

---

## Waarom baseline niet op shared Neon

1. Schema **bestaat al** — baseline zou dubbele CREATE / conflicts geven
2. `_prisma_migrations` heeft **andere history** (72 stappen vs 1 baseline)
3. Idempotente Phase-8 SQL is voor **repository parity**, niet voor re-apply

---

## Acht gereconstrueerde migratiemappen (Phase 8)

| Situatie | Actie |
|----------|-------|
| Shared Neon | Al applied by name — **geen deploy** |
| Checksum ≠ lokaal bestand | **Verwacht** (class B); geen actie tot deploy klaagt |
| Lokaal in `prisma/migrations/` | **Niet committen naar actieve keten** — verplaats naar `docs/baseline-history/phase8-reconstructed/` |
| Toekomstige `migrate deploy` | Alleen **nieuwe** migraties na cutoff; als Prisma checksum-waarschuwing op oude 8: case-by-case `resolve` na backup |

---

## Checksum-mismatches (28 historische)

- Database draaide **oudere** SQL-versies
- Lokale bestanden later idempotent herschreven
- **Geen redeploy** — Prisma ziet migraties als applied
- Documentatie: `homecheff-prisma-migration-drift-audit.md`

---

## Lineaire historie vanaf cutoff

| Omgeving | Migratiehistorie na Phase 9 promote |
|----------|-------------------------------------|
| **Shared Neon** | Bestaande 72 + **nieuwe** migraties ≥ `20260715_*` (eerste post-baseline delta) |
| **Greenfield** | `20260714_greenfield_current_state_baseline` + **dezelfde** post-cutoff migraties |

**Eerste migratie die beide paden deelt:** de eerste `prisma/migrations/` map met timestamp **na** `20260714_greenfield_current_state_baseline` die **niet** in baseline SQL zit.

Huidige schema is volledig in baseline → eerste gedeelde delta is de **volgende feature-migratie** die na Phase 9 wordt aangemaakt.

---

## Productie-deploy

- **App-deploy (Vercel):** onafhankelijk van baseline; geen migratie-deploy vereist voor Phase 9
- **Schema-deploy prod:** alleen `migrate deploy` voor **nieuwe** pending migraties — niet baseline pack

---

## Monitoring

Bij toekomstige `migrate deploy` op shared Neon:

1. `npx prisma migrate status`
2. Bij checksum error: identificeer **één** migratienaam
3. Backup
4. Alleen dan `npx prisma migrate resolve --applied <name>` als DB-state overeenkomt met intent
5. **Geen** bulk resolve
