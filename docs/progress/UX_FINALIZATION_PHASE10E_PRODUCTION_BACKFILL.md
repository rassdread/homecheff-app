# UX Finalization — Phase 10E Production Backfill

**Date:** 2026-07-08

## Goal

Prepare production database for the first city pilot by migrating all marketplace Products to the canonical model. Safe, idempotent, auditable, reversible. No new functionality.

## Delivered

| Artifact | Purpose |
|----------|---------|
| `lib/marketplace/normalization/backfill-safety.ts` | Pre-write safety rules (pure) |
| `scripts/audit-production-backfill-phase10e.ts` | Production audit + JSON + safety gate |
| `scripts/validate-production-backfill-phase10e.ts` | Guards + chained validators |
| `docs/audits/PRODUCTION_BACKFILL_PHASE10E_AUDIT.md` | Runbook |

## Migration SSOT (unchanged from 10C)

```bash
npx tsx scripts/audit-production-backfill-phase10e.ts
npx tsx scripts/backfill-marketplace-data-normalization-phase10c.ts --dry-run
CONFIRM_BACKFILL=1 npx tsx scripts/backfill-marketplace-data-normalization-phase10c.ts --write
npx tsx scripts/audit-production-backfill-phase10e.ts
```

## Production checklist

1. **Backup** production database
2. Set `DATABASE_URL` to production
3. Run 10E audit — review JSON report
4. Run dry-run — review every `updates` payload
5. Confirm safety pass (exit 0)
6. `CONFIRM_BACKFILL=1 --write`
7. Re-run audit — expect 0 writable rows
8. Runtime smoke (feed, filters, detail, proposals)

## Validation

```bash
npx tsx scripts/validate-production-backfill-phase10e.ts
npm run lint
npm run build
```

## Unchanged

- Marketplace architecture (7D–10D)
- UI, payment flows, ranking
- Phase 10C backfill script (sole write path)
