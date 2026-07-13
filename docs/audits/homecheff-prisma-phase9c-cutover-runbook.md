# Phase 9C — Archive-Promote Cutover Runbook

**Doel:** 62 historische folders archiveren, baseline promoten, shared Neon veilig laten doorlopen.  
**Elke ⛔ STOP** vereist menselijke beslissing — geen automatische voortzetting bij falen.

---

## Fase 0 — Preconditions

- [ ] Phase 9B commit `695c00c` op branch
- [ ] Phase 9C review gelezen
- [ ] `npm run db:migration:validate` groen **na** promote (nu verwacht fail strict)

---

## Fase 1 — Vercel policy (⛔ STOP 1)

1. PR: verwijder `migrate deploy` uit `vercel-build.js`
2. Merge naar deploy-branch **vóór** archive-promote productie-deploy
3. Verifieer preview build **zonder** migrate

**Stopcriteria:** build nog steeds `migrate deploy` op shared → **STOP**

---

## Fase 2 — DB backup & fingerprint (⛔ STOP 2)

```bash
# Read-only prechecks
npx prisma migrate status
npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-url "$DATABASE_URL" --script
npx tsx scripts/validate-current-state-baseline.ts
```

1. Neon point-in-time backup / export note
2. Noteer: host, database, `_prisma_migrations` count (~72)
3. Sla schema diff op (verwacht ~111B `HcpCarouselSlide.updatedAt`)

**Stopcriteria:** diff > accepted noise → **STOP**

---

## Fase 3 — Archive-promote commit (⛔ STOP 3)

### Git move plan

```text
# Conceptueel — uitvoeren alleen na GO
mkdir -p prisma/migrations-archive/pre-20260714-greenfield/loose-sql

git mv prisma/migrations/<62 folders> prisma/migrations-archive/pre-20260714-greenfield/

git mv prisma/migrations/*.sql prisma/migrations-archive/pre-20260714-greenfield/loose-sql/

cp prisma/baseline-staging/.../promote-to-migrations/20260714_greenfield_current_state_baseline \
   prisma/migrations/20260714_greenfield_current_state_baseline
```

4. Voeg `prisma/migrations-archive/pre-20260714-greenfield/README.md` toe
5. Validators:

```bash
npx tsx scripts/validate-archive-promote-plan.ts
npx tsx scripts/validate-migration-cutoff.ts --strict
npx tsx scripts/validate-dual-track-migration-config.ts
npx tsx scripts/simulate-archive-promote.ts --write-manifest
```

**Stopcriteria:** strict cutoff fail, checksum mismatch, <62 archive → **STOP**

⛔ **Geen Vercel production deploy** tussen Fase 3 en Fase 4

---

## Fase 4 — Baseline resolve shared Neon (⛔ STOP 4)

**Approval:** tweede persoon / expliciet ticket

```bash
export DATABASE_URL="..."  # shared Neon
npx prisma migrate resolve --applied 20260714_greenfield_current_state_baseline
npx prisma migrate status
```

**Verwacht:** baseline applied; applied-but-missing voor gearchiveerde namen

**Stopcriteria:** resolve error, baseline DDL per ongeluk uitgevoerd → **STOP**

---

## Fase 5 — Greenfield disposable test (⛔ STOP 5)

```bash
export GREENFIELD_DATABASE_URL="..."
export GREENFIELD_TEST_ACK=I_UNDERSTAND_DISPOSABLE
npm run db:greenfield:test
```

**Stopcriteria:** schema diff niet leeg, CRUD fail → **STOP**

---

## Fase 6 — Merge & deploy (⛔ STOP 6)

1. Merge `performance/phase2-baseline` → `main` (na greenfield GO)
2. Controlled Vercel deploy
3. Post-deploy: `migrate status` read-only

---

## Rollback pointers

Zie [`homecheff-prisma-phase9c-rollback-plan.md`](homecheff-prisma-phase9c-rollback-plan.md)

---

## Noodstop

Bij twijfel: **geen deploy**, **geen resolve**, herstel Git state (Fase A rollback).
