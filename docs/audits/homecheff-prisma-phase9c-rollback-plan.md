# Phase 9C — Rollback Plan

**Principe:** nooit `_prisma_migrations` bulk-deleten zonder backup en expliciete approval.

---

## A. Archive-promote nog niet gepusht

| Actie | Rollback |
|-------|----------|
| Lokale `git mv` | `git reset --hard` / `git mv` terug |
| Validators fail | Niet committen |
| **Risico** | Laag — geen DB impact |

---

## B. Archive-promote gepusht, niet gedeployed

| Actie | Rollback |
|-------|----------|
| Revert commit op branch | `git revert <archive-promote-sha>` |
| Remote branch | Push revert commit |
| Shared Neon | Ongewijzigd — geen actie |
| **Risico** | Laag |

---

## C. Baseline resolved op shared, code niet gedeployed

| Actie | Rollback |
|-------|----------|
| `_prisma_migrations` | `migrate resolve --rolled-back 20260714_greenfield_current_state_baseline` **alleen** met backup + GO |
| Git | Revert archive-promote OF restore 62 folders |
| Schema | Ongewijzigd (geen DDL bij resolve) |
| **Risico** | Medium — history entry blijft spoor |

---

## D. Deployment uitgevoerd, post-cutoff migrate faalt

| Actie | Rollback |
|-------|----------|
| Vercel | Rollback deployment naar vorige build |
| DB | Fix-forward nieuwe migratie; **geen** down-migration zonder plan |
| Status | `migrate status` diagnostiek |
| **Risico** | Hoog — app/schema mismatch mogelijk |

---

## E. Shared / greenfield histories lopen uiteen

| Symptoom | Herstel |
|----------|---------|
| Greenfield heeft baseline DDL, shared alleen resolve | **Verwacht** — schema gelijk houden via `schema.prisma` |
| Shared missing post-cutoff | Handmatig `migrate deploy` met approval |
| Greenfield extra migrations | Reset disposable DB; herhaal bootstrap |
| Checksum drift | Documenteer; geen bulk resolve zonder review |

---

## Backup-minimum vóór cutover

1. Neon PITR timestamp genoteerd
2. `homecheff-prisma-migration-inventory.json` snapshot
3. `migrate diff` output opgeslagen
4. Baseline checksum: `834d5d1b632f8348…` (manifest)

---

## Verboden rollback

- `DELETE FROM _prisma_migrations` bulk
- `migrate reset` op shared Neon
- Baseline DDL handmatig op shared "om op te schonen"
