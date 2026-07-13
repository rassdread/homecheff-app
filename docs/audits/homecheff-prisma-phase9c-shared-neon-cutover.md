# Phase 9C — Shared Neon Cutover Simulation

**Prisma:** 6.16.2  
**Methode:** Tijdelijke migration root in `/tmp` (baseline-only) + `npx prisma migrate status --config` (read-only)  
**Bewijs:** [`homecheff-prisma-phase9c-cutover-readiness-report.json`](homecheff-prisma-phase9c-cutover-readiness-report.json)

---

## Simulatie-setup

| Element | Waarde |
|---------|--------|
| Lokale actieve root (gesimuleerd) | Alleen `20260714_greenfield_current_state_baseline` |
| Shared Neon | 72+ applied records (historische keten) |
| Muterende acties | **Geen** |

---

## `migrate status` na archive-promote (baseline **niet** resolved)

**Exit code:** non-zero (verschillende history)

**Output (samenvatting):**

```
The last common migration is: null

The migration have not yet been applied:
20260714_greenfield_current_state_baseline

The migrations from the database are not found locally in prisma/migrations:
<alle historische applied migrations>
```

| Observatie | Betekenis |
|------------|-----------|
| `last common migration: null` | Geen overlap tussen lokale baseline-only root en DB-history |
| Baseline **pending** | `resolve --applied` of `deploy` (DDL) vereist op shared |
| DB migrations **not found locally** | Verwacht applied-but-missing na archive |
| Deploy geblokkeerd? | **Nee** — Prisma blokkeert niet; pending baseline **wordt** uitgevoerd bij deploy |

---

## `migrate deploy` gedrag (niet uitgevoerd — analyse)

| Scenario | Gedrag |
|----------|--------|
| Baseline pending, geen resolve | **Probeert** ~114KB CREATE TABLE DDL → **faalt** op bestaande objecten |
| Na `resolve --applied` baseline | Deploy = no-op tot nieuwe post-cutoff migratie |
| Applied-but-missing historisch | **Genegeerd** voor deploy; geen re-run |
| 28 checksum mismatches | Cosmetisch; geen re-apply |

---

## Checksumgedrag

- `resolve --applied` registreert checksum van **lokale** `migration.sql`
- Herhaalde resolve → Prisma error (migration already applied)
- Wijzigen baseline SQL na resolve → checksum drift warning bij status

---

## Post-cutoff detectie

Na promote + resolve: nieuwe folder `20260715_*` in actieve root → `migrate status` toont pending; deploy past alleen die toe.

---

## Baseline resolve — DEEL 4 samenvatting

| Vraag | Antwoord |
|-------|----------|
| **Nodig?** | **Ja** op shared Neon |
| **Wanneer?** | Na archive-promote commit (baseline folder moet lokaal bestaan) |
| **Vóór/na promote?** | **Na** promote (resolve vereist folder in `prisma/migrations/`) |
| **Config** | `prisma/schema.prisma` + standaard migrations path |
| **DDL uitvoeren?** | **Nee** — schema bestaat al |
| **Verificatie** | `migrate diff` schema ↔ DB (± `HcpCarouselSlide.updatedAt`) |
| **Backup** | Neon point-in-time / manual dump vóór resolve |
| **Rollback resolve** | `migrate resolve --rolled-back` (alleen met approval; risicovol) |

### GO/HOLD baseline resolve

| | |
|---|---|
| **GO** | Na Vercel auto-migrate uitgeschakeld + archive-promote op branch + schema diff OK + backup |
| **HOLD** | Tot bovenstaande prechecks groen |

---

## Geen acties uitgevoerd

`migrate deploy`, `migrate resolve`, `db execute` — **niet** uitgevoerd in Phase 9C.
