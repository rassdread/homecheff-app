# Phase 9 — Greenfield baseline (staging)

**Status:** STAGING — not in active `prisma/migrations/` chain.

| File | Purpose |
|------|---------|
| `schema_baseline.sql` | Full DDL from `schema.prisma` (Prisma migrate diff) |
| `system_seed.sql` | Optional idempotent system rows (sentinel commented out) |
| `manifest.json` | Version, cutoff, proposed migration name |

## Do not

- Run against shared Neon (`ep-summer-darkness-a2l0745u` or production `DATABASE_URL`)
- Run `prisma migrate deploy` on empty DB against the 70 historical folders

## Disposable test (when approved)

```bash
export DATABASE_URL="postgresql://..."  # disposable Neon only
export GREENFIELD_TEST_ACK=I_UNDERSTAND_DISPOSABLE
npx tsx scripts/run-disposable-greenfield-test.ts --execute
```

## Validation (read-only)

```bash
npx tsx scripts/validate-current-state-baseline.ts
```
