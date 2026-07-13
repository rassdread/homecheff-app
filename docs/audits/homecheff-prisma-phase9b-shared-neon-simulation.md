# Phase 9B — Shared Neon Simulatie (read-only)

**Datum:** 2026-07-13  
**Branch:** `performance/phase2-baseline`  
**Methodiek:** Inventory JSON + lokale folder-inventaris + `npx prisma migrate status` (read-only)

---

## Live baseline (vóór archive)

```
npx prisma migrate status
→ 62 migrations found in prisma/migrations
→ Database schema is up to date!
```

| Metriek | Waarde |
|---------|--------|
| Lokaal actief | 62 |
| DB `_prisma_migrations` | 72 |
| Match checksum | 34 |
| Checksum mismatch | 28 |
| DB-only (niet in Git) | 8 (Phase 8 reconstructies, reeds op Neon) |
| Laatste gemeenschappelijke | `20260709_phase13e_admin_p0` |
| Lokaal na common | `20260713_dish_status_created_at_feed_index`, `add_dish_reviews` |

---

## Optie-matrix simulatie

Gegenereerd door: `npx tsx scripts/simulate-shared-neon-migration-options.ts`  
Output: `docs/audits/homecheff-prisma-phase9b-simulation-latest.json`

| Optie | `migrate status` | Deploy nieuwe migratie | History-manipulatie | Drift |
|-------|------------------|------------------------|---------------------|-------|
| **Huidige staat** | Up to date | Werkt | Geen | 28 checksum mismatch (cosmetisch) |
| **A — Archive + baseline root** | applied-but-missing (~70) | **Werkt** voor post-cutoff | Eenmalig `resolve --applied` baseline | Laag — schema unchanged |
| **B — Dual config (shared)** | Gelijk aan huidig | Werkt | Geen op shared track | Laag |
| **B — Dual config (greenfield)** | N.v.t. (disposable) | Baseline + post-cutoff | Geen op shared | Geen op shared |
| **C — Bootstrap + resolve** | Gelijk aan A na promote | Werkt | `resolve` alleen | Laag |
| **D — Migration package** | Gelijk aan A | Custom | Package sync | Medium |
| **E — History cutover** | Onvoorspelbaar | **Kan blokkeren** | **Bulk `_prisma_migrations`** | **Kritiek** |

---

## Welke optie blijft “schoon”?

| Omgeving | Schoonste |
|----------|-----------|
| **Shared Neon schema** | Huidige staat + optie A (deploy pending only) |
| **`migrate status` output** | Alleen huidige staat (geen missing warnings) |
| **Greenfield reproduceerbaar** | **Alleen optie A** (of B greenfield track) |
| **Geen handmatige `_prisma_migrations`** | A, B, C — **niet** E |

---

## Applied-but-missing na archive (verwacht)

Na verplaatsen van 61 folders naar archive blijven DB-records bestaan. Prisma toont:

> The following migration(s) are applied to the database but missing from the local migrations directory: …

**Dit is veilig** zolang:
- Geen pending migrations met destructieve SQL conflicteren met live schema
- Baseline **niet** opnieuw als DDL op shared wordt uitgevoerd
- Baseline op shared alleen via `migrate resolve --applied` (registratie)

---

## Deploy-blokkades

| Scenario | Blokkeert deploy? |
|----------|-------------------|
| Nieuwe post-cutoff migratie | Nee — normale flow |
| Baseline folder op shared zonder resolve | Ja — pending baseline DDL zou falen (tabellen bestaan) |
| Greenfield `deploy` op lege DB met 62 oude folders | **Ja** — eerste failure `20250108000000_auto_encryption` |
| Checksum mismatch op reeds applied | Nee — deploy gaat door (Prisma 6) |

---

## Uitgevoerde acties

| Actie | Uitgevoerd? |
|-------|-------------|
| `migrate deploy` | ❌ |
| `migrate resolve` | ❌ |
| `db execute` | ❌ |
| `migrate status` | ✅ read-only |
