# Archived legacy Prisma migrations (pre-cutoff)

**Cutoff:** 2026-07-13  
**Baseline:** `20260714_greenfield_current_state_baseline`

## Why these migrations were archived

HomeCheff historically accumulated a long migration chain that is **not greenfield-proof** (fails on empty databases).
To enable reproducible greenfield bootstrap, HomeCheff moves to a **current-state baseline** migration and a single
future post-cutoff migration line.

## What lives here

- **62 legacy migration folders** that were previously under `prisma/migrations/`
- **Loose SQL files** formerly in `prisma/migrations/` are stored under `loose-sql/` for reference

These are archived for traceability and rollback planning only.

## What stays active after promote

`prisma/migrations/` should contain only:

- `20260714_greenfield_current_state_baseline/`
- future post-cutoff migrations (if/when introduced)

## Shared Neon safety

Shared Neon preserves its existing `_prisma_migrations` history. After archive-promote, the baseline is registered on
shared Neon **as applied** via a one-time `prisma migrate resolve --applied ...` (no DDL from the baseline is executed
on shared).

