# Production Canonical Backfill — Phase 10E Audit

**Date:** 2026-07-08  
**Scope:** Safe production migration to canonical marketplace model (Phases 7A–10D). No new features. No UI redesign. No architecture changes.

---

## Executive summary

Phase 10E operationalizes the **existing Phase 10C migration** for production:

| SSOT | Role |
|------|------|
| `propose-product-normalization.ts` | Normalization proposals |
| `audit-marketplace-data-normalization-phase10c.ts` | Base audit |
| `audit-production-backfill-phase10e.ts` | **Production audit + safety report** |
| `backfill-marketplace-data-normalization-phase10c.ts` | **Only write path** |
| `backfill-safety.ts` | Pre-write safety verification |

**No second migration. No duplicate normalization logic.**

---

## Part 1 — Production safety

All writes flow through `proposeProductNormalization()` → existing helpers:

`canonical-model` → `taxonomy-normalize` → `taxonomy-resolve` → `settlement-options` → `settlement-router`

---

## Part 2 — Production audit

```bash
# Point DATABASE_URL at production (read-only user recommended for audit)
npx tsx scripts/audit-production-backfill-phase10e.ts
npx tsx scripts/audit-marketplace-data-normalization-phase10c.ts
```

**JSON report:** `docs/audits/phase10e-production-backfill-audit-latest.json`

Reports: totals, canonical vs writable vs skipped, manual review, unmapped taxonomy, pending accepted values, Stripe warnings, category/listingKind/settlement/accepted-value flags, safety verification.

---

## Part 3 — Dry-run verification

```bash
npx tsx scripts/backfill-marketplace-data-normalization-phase10c.ts --dry-run
```

Shows exact `productId`, title, and `updates` JSON per row. Repeatable — no writes.

Optional single-row:

```bash
npx tsx scripts/backfill-marketplace-data-normalization-phase10c.ts --dry-run --id=<uuid>
```

---

## Part 4 — Safety verification

Automated in `audit-production-backfill-phase10e.ts` via `backfill-safety.ts`:

| Rule | Guarantee |
|------|-----------|
| Accepted values | Never cleared; `pending:*` ids preserved |
| REQUEST → OFFER | Never |
| Specializations | Not cleared when source existed |
| Settlement booleans | Less permissive only for documented CONTACT legacy fix |
| ListingKind | Drift reported when write would change derived kind |

Audit exits non-zero if any writable proposal fails safety checks.

---

## Part 5 — Production write

**Prerequisites:** DB backup, audit + dry-run reviewed, safety pass.

```bash
CONFIRM_BACKFILL=1 npx tsx scripts/backfill-marketplace-data-normalization-phase10c.ts --write
```

- Idempotent (re-run → 0 updates)
- Per-product `prisma.product.update`
- No deletes
- Explicit DB values preserved except documented legacy fixes

**Rollback:** Restore from backup or apply inverse patch from dry-run log.

---

## Part 6 — Post-write verification

```bash
npx tsx scripts/audit-production-backfill-phase10e.ts
npx tsx scripts/audit-marketplace-data-normalization-phase10c.ts
```

**Expected:** `requiringUpdates: 0`. Informational items may remain:

- `checkout_needs_stripe_connect` (seller Connect — not a Product write)
- `unmapped_specializations` (manual seller review)
- Pending accepted-value proposals

---

## Part 7 — Runtime verification checklist

After production write, manually verify:

- [ ] Homepage feed — view + category chips
- [ ] Ik zoek / Ik bied + accepted values filter
- [ ] Reverse discovery (offer mode + value chips)
- [ ] Settlement icons on tiles + detail
- [ ] Proposal prefill from reverse discovery session
- [ ] Profile listings / favorites / seller dashboard
- [ ] Wanted / Services / Inspiration views

Behaviour should match pre-migration; only data consistency improves.

---

## Part 8 — Regression confirmation

Unchanged: canonical-model, taxonomy SSOT, reverse discovery, settlement router, tile pipeline, GeoFeed filters, URL migration, session persistence (`home-filter-persist.ts`).

Validator chains Phases 10D → 7D.

---

## Local verification snapshot (dev DB)

### Pre-write

| Metric | Value |
|--------|------:|
| Products | 7 |
| Requiring updates | 5 |
| Skipped (audit-only) | 2 |
| Safety violations | 0 |

### Post-write (2026-07-08 local)

| Metric | Value |
|--------|------:|
| Updated | 5 |
| Requiring updates | **0** |
| Canonical rows | 1 |
| Audit-only (Stripe etc.) | 6 |
| Manual review | 1 (`CHEFF` unmapped spec) |

Writable changes applied: `specializations` + `subcategory` sync. Idempotent re-run: 0 updates.

---

## Architecture confirmation

No changes to payment flows, ranking, feed fetch strategy, or canonical architecture files.
