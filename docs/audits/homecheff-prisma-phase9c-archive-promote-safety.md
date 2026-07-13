# Phase 9C — Archive-Promote Safety Review

**Branch:** `performance/phase2-baseline`  
**Datum:** 2026-07-13  
**Status:** Read-only review — geen file moves, geen DB-acties

---

## DEEL 1 — Exacte archive-set

Zie machineleesbaar: [`homecheff-prisma-phase9c-archive-manifest.json`](homecheff-prisma-phase9c-archive-manifest.json)

### Samenvatting per categorie

| Categorie | Aantal | Beschrijving |
|-----------|--------|--------------|
| **A** pre-cutoff historisch | **62** | Alle huidige `*/migration.sql` folders |
| **B** baseline promote | **1** | `20260714_greenfield_current_state_baseline` (uit staging) |
| **C** post-cutoff actief | **0** | Geen folder blijft actief na promote |
| **D** onzeker / blokkade | **8** | Losse `.sql` bestanden in `prisma/migrations/` root |

### Eerste / laatste pre-cutoff (folders)

| | Migratie |
|---|----------|
| **Eerste** | `20250108000000_auto_encryption` |
| **Laatste (lex)** | `add_dish_reviews` |
| **Laatste (semantisch)** | `20260713_dish_status_created_at_feed_index` — opgenomen in baseline |

### Timestamps na cutoff-datum (2026-07-13)

Geen folder met geldig `YYYYMMDD` **na** 2026-07-13 behalve baseline (nog niet actief):

- `20260713_dish_status_created_at_feed_index` — **vóór** baseline-naam (`20260713` < `20260714_…`)

### Ongeldig timestampformaat (folders)

| Folder | Opmerking |
|--------|-----------|
| `20250114_add_conversation_participant_hidden` | korte datum |
| `20250115_add_dish_video` | korte datum |
| `20260709_phase13e_admin_p0` | afwijkend patroon |
| `add_dish_reviews` | geen timestamp — **absorbed in baseline** |

### D-class: losse SQL-bestanden (kritiek)

Deze staan **niet** in de 62 folders maar **wel** in `prisma/migrations/`:

1. `add_admin_preferences.sql`
2. `add_delivery_countdown_fields.sql`
3. `add_delivery_online_status.sql`
4. `add_notification_order_fields.sql`
5. `add_social_onboarding.sql`
6. `add_tab_permissions.sql`
7. `add_user_online_status.sql`
8. `manual_add_stock_reservation.sql`

**Promote-blocker:** moeten naar `migrations-archive/.../loose-sql/` of `docs/` — Prisma negeert ze niet automatisch als ze in root blijven.

### Dubbele timestamps

Geen dubbele **foldernames**. DB-inventory toont dubbele applied records voor `20250115000000_add_notification_preferences` (3×) — historisch DB-artefact, geen lokale duplicaatfolder.

### Na promote — actieve root

```
prisma/migrations/
  migration_lock.toml
  20260714_greenfield_current_state_baseline/
```

**62 folders** → `prisma/migrations-archive/pre-20260714-greenfield/`  
**8 loose SQL** → `prisma/migrations-archive/pre-20260714-greenfield/loose-sql/`  
**README** in archive verplicht

---

## DEEL 2 — Virtuele filesystem-simulatie

Uitgevoerd door `simulate-archive-promote.ts` (kopieën alleen in `/tmp`):

| Check | Resultaat |
|-------|-----------|
| Geen bestanden verloren | ✅ 62 archive + 1 baseline |
| Baseline eerste actieve | ✅ |
| Geen pre-cutoff actief | ✅ |
| Checksums behouden | ✅ SHA-256 match |
| Git traceerbaar | ✅ `git mv` aanbevolen (niet `cp`) |

Rapport: [`homecheff-prisma-phase9c-simulate-report.json`](homecheff-prisma-phase9c-simulate-report.json)

---

## Bevestiging

Geen `git mv`, geen wijziging `prisma/migrations/`, geen commit/push in Phase 9C.
