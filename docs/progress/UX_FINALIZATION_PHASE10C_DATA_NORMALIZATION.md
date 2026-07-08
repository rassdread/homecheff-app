# UX Finalization — Phase 10C Data Normalization

**Date:** 2026-07-08

## Goal

Normalize legacy marketplace Product data to canonical standards (intent / category / settlement / taxonomy) so filters and discovery work consistently for old and new items. No UX redesign. No data loss.

## Delivered

| Artifact | Purpose |
|----------|---------|
| `lib/marketplace/normalization/propose-product-normalization.ts` | Pure proposal SSOT (existing helpers only) |
| `scripts/audit-marketplace-data-normalization-phase10c.ts` | Read-only DB audit + JSON report |
| `scripts/backfill-marketplace-data-normalization-phase10c.ts` | Idempotent dry-run / write backfill |
| `scripts/validate-marketplace-data-normalization-phase10c.ts` | Static + unit guards |
| `docs/audits/MARKETPLACE_DATA_NORMALIZATION_PHASE10C_AUDIT.md` | Full audit |

## Local audit snapshot

- 7 products, 22 dishes
- 5 products need writable backfill (specializations + subcategory sync)
- 2 products skipped (canonical or audit-only)
- 6 products flagged `checkout_needs_stripe_connect` (audit-only)

## Validation

```bash
npx tsx scripts/audit-marketplace-data-normalization-phase10c.ts
npx tsx scripts/backfill-marketplace-data-normalization-phase10c.ts --dry-run
npx tsx scripts/validate-marketplace-data-normalization-phase10c.ts
npx tsx scripts/validate-pilot-polish-phase10b.ts
npm run lint
npm run build
```

## Production backfill

```bash
CONFIRM_BACKFILL=1 npx tsx scripts/backfill-marketplace-data-normalization-phase10c.ts --write
```

Backup database before write. Re-run audit to confirm 0 pending updates.

## Unchanged

- Marketplace architecture (7D)
- Settlement router (8E)
- Filter UI structure (7E) — URL migration already wired
- Ranking, payment, feed fetch strategy

## 10C.13 USP visibility

Reverse discovery promoted from advanced filters to first-class discovery UI:

- Accepted-values filter visible for both Ik zoek / Ik bied (sidebar + mobile)
- Hero, guest panel, empty states, create form and detail settlement copy updated
- Validator section `10C.13 USP visibility` added
