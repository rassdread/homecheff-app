# Phase 6 — Greenfield Database Strategy

**Branch:** `performance/phase2-baseline`  
**Datum:** 2026-07-13

---

## Probleem

- **62** lokale migratiemappen vs **72** applied records op shared Neon.
- **8** migraties alleen in DB (geen Git-bestanden).
- **28** checksum-mismatches op historische migraties (applied, niet opnieuw deployen).
- Fresh `migrate deploy` op lege DB **mist** affiliate/promo/product-dimension/superadmin/password effects.

---

## Opties

### Optie A — Alle ontbrekende migraties exact reconstrueren

| Aspect | Beoordeling |
|--------|-------------|
| Reproduceerbaarheid | Hoog **als** byte-identieke SQL gevonden |
| Checksum | Vereist **A**-classificatie per migratie — originelen **niet** in Git |
| Risico | Medium — verkeerde SQL = silent drift |
| Onderhoud | 8 extra mappen + 28 mismatch blijft |
| `migrate deploy` | Werkt op greenfield **na** reconstructie + test |
| CI/test DB | Vereist disposable DB + volledige chain |
| Rollback | Per migratie; destructieve early migrations blijven risico |

**Verdict:** **Niet haalbaar** zonder originele bestanden (checksum match onmogelijk).

---

### Optie B — Nieuwe baseline vanaf huidig live schema

| Aspect | Beoordeling |
|--------|-------------|
| Reproduceerbaarheid | Hoog voor **huidige** schema-state |
| Checksum | N/A — nieuwe baseline vervangt history voor greenfield |
| Risico | Hoog op **bestaande** DB — vereist reset of parallel project |
| Onderhoud | Eén squashed migratie — simpel voor nieuwe envs |
| `migrate deploy` | **Niet** combineerbaar met bestaande 72-record history zonder reset |
| CI/test DB | `prisma migrate diff` + single deploy OK |
| Rollback | Alleen full restore |

**Verdict:** Goed voor **nieuw project / fork**; **onacceptabel** voor shared Neon met data.

---

### Optie C — Hybride (voorkeur)

| Aspect | Beoordeling |
|--------|-------------|
| Reproduceerbaarheid | Hoog — 62 bestaande + 8 idempotente baseline files |
| Checksum | Shared Neon: **resolve --applied** (history sync, checksum mag afwijken). Greenfield: SQL draait idempotent |
| Risico | Laag op shared DB (geen DDL als objecten bestaan) |
| Onderhoud | 8 extra mappen; historische 28 mismatch **ongewijzigd** |
| `migrate deploy` | Greenfield: volledige chain; Shared: pending = 0 na resolve |
| CI/test DB | Disposable Neon: `deploy` end-to-end test |
| Rollback | Backup + geen resolve zonder review |

**Verdict:** **Aanbevolen** — sluit aan op reconciliation plan Fase 2.

---

## Voorkeursstrategie: **Optie C (Hybride)**

### Fase C1 — Schema sync (Phase 6, **done**)

- `schema.prisma` ↔ live DB voor Product, PromoCode.
- Geen migratie uitgevoerd.

### Fase C2 — Baseline-pack (8 mappen, **pending**)

Chronologische idempotente `migration.sql` per DB-only naam (zie `homecheff-prisma-phase6-migration-reconstruction.json`).

**Niet** automatisch aangemaakt in Phase 6 — alleen gedocumenteerd tot review.

### Fase C3 — Shared Neon history sync (**pending**, na backup)

```bash
# Voorbeeld — NIET uitgevoerd in Phase 6
npx prisma migrate resolve --applied 20260208220000_add_user_password_hash
# … × 8
```

Alleen waar SQL **aantoonbaar** al op DB staat.

### Fase C4 — Greenfield verificatie (**pending**)

1. Neon branch / disposable database.
2. `npx prisma migrate deploy` (volledige 70-map chain na baseline-pack).
3. `prisma migrate diff` schema ↔ DB → leeg (modulo Hcp default).
4. Smoke-check + kritieke app flows.

### Fase C5 — Optionele forward migratie

`20260714_phase6_schema_sync_baseline` — **alleen** als consolidatie voor **nieuwe** omgevingen die de 8 DB-only namen **niet** in history hebben; **niet** dubbel op shared Neon.

---

## Checksum-strategie

| Omgeving | Aanpak |
|----------|--------|
| Shared Neon (72 records) | `resolve --applied` met gereconstrueerde files; **accepteer** checksum mismatch op oude records |
| Greenfield | Idempotent SQL in baseline files; checksum = hash van **nieuw** bestand |
| Toekomst: origineel gevonden | Vervang file → checksum moet DB-record matchen (**A**) |

---

## CI / test database

```yaml
# Voorstel (documentatie)
- job: prisma-greenfield
  steps:
    - create disposable postgres / neon branch
    - prisma migrate deploy
    - prisma migrate diff (expect empty except Hcp default)
    - npm run smoke-check
```

---

## Rollback

| Actie | Rollback |
|-------|----------|
| Schema-only commit | Git revert |
| Baseline folders toegevoegd | Git revert; geen DB impact tot deploy |
| resolve --applied | Handmatig `_prisma_migrations` row delete (break-glass) |
| migrate deploy op fresh DB | Drop database / restore empty |

---

## GO/HOLD

| Stap | Besluit |
|------|---------|
| Schema sync commit | **GO** |
| Baseline-pack commit | **HOLD** — review reconstruction JSON |
| resolve × 8 | **HOLD** — na backup + folder commit |
| Greenfield test | **HOLD** — na baseline-pack |
| merge main | **HOLD** — na C3+C4 |
| migrate deploy prod | **HOLD** |

---

## Relatie tot 28 checksum-mismatches

**Geen actie** op shared DB. Historische applied migraties niet opnieuw deployen. Greenfield chain gebruikt **huidige** lokale bestanden (mismatch t.o.v. oorspronkelijke deploy is OK zolang SQL idempotent of alleen op fresh DB).

---

## Bevestiging

Geen databaseacties in Phase 6 greenfield planning.
