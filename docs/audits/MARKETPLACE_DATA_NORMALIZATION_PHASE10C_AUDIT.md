# Marketplace Data Normalization — Phase 10C Audit

**Date:** 2026-07-08  
**Scope:** Normalize legacy Product rows to canonical marketplace model (7D–10B). No UX redesign, no ranking/payment changes, no data loss.

---

## Executive summary

Phase 10C adds a **read-only audit**, an **idempotent backfill**, and a **proposal SSOT** (`lib/marketplace/normalization/propose-product-normalization.ts`) that reuses existing helpers only:

`canonical-model.ts` → `derive-listing-kind.ts` → `settlement-options.ts` → `taxonomy-normalize.ts` → `taxonomy-resolve.ts`

**Local DB audit (2026-07-08):**

| Metric | Count |
|--------|------:|
| Products | 7 |
| Dishes (inspiration, separate model) | 22 |
| Legacy listings | 0 |
| Fully canonical (no writes) | 0 |
| Needs backfill (writable proposals) | 5 |
| Audit-only flags (no auto-write) | 2 |

Primary writable issues: **missing/stale `specializations[]`** and **`subcategory` out of sync** (legacy rows with `subcategory` set but empty specs array).  
Primary audit-only flag: **`checkout_needs_stripe_connect`** (seller guidance — not a Product field change).

---

## 1. Old data audit (10C.1)

### Product (V2/V3 — in scope)

All marketplace normalization targets **`Product`** rows. Fields audited:

| Field | Role |
|-------|------|
| `listingIntent` | OFFER / REQUEST |
| `marketplaceCategory` | 6-vertical Prisma enum |
| `category` | Legacy CHEFF / GROWN / DESIGNER |
| `specializations[]` | Canonical taxonomy ids |
| `subcategory` | Legacy primary slug (synced from specs) |
| `acceptedSpecializations[]` | Accepted-value taxonomy ids |
| `barterOpenness` | Barter axis |
| `priceModel` / `priceCents` | Display only — **never** determines intent |
| `orderMethod` | Legacy settlement fallback |
| `acceptHomeCheffPayment` / `acceptDirectContact` | Settlement booleans |

`listingKind` is **derived** (not stored) via `deriveListingKind()`.

### Dish / Listing (out of Product backfill)

- **Dish** — inspiration pool; no V2 marketplace columns. Counted in audit; feed classifies as INSPIRATION.
- **Listing** — legacy model; 0 rows in local DB. Feed transforms at read time.

### Issue taxonomy

| Issue key | Meaning | Auto-backfill? |
|-----------|---------|----------------|
| `missing_marketplaceCategory` | Null `marketplaceCategory` | Yes — from legacy `category` |
| `missing_specializations_array` | Empty specs but mappable `subcategory` | Yes |
| `stale_specializations` | Specs not canonical ids | Yes — normalize in place |
| `subcategory_out_of_sync` | `subcategory` ≠ primary spec | Yes |
| `stale_accepted_values` | Accepted ids need normalization | Yes — normalize, never delete |
| `unmapped_specializations` | Raw strings with no taxonomy match | Report only |
| `unmapped_accepted_values` | Accepted strings with no match | Report only |
| `service_misclassified_category` | Service listingKind but physical category | Yes — infer from taxonomy |
| `category_spec_mismatch` | Spec registry category ≠ stored category | Yes |
| `legacy_category_mismatch` | `category` ≠ `marketplaceToProductCategory()` | Yes |
| `settlement_contact_order_method_mismatch` | `orderMethod=CONTACT` but default booleans | Yes — legacy fix only |
| `checkout_needs_stripe_connect` | Checkout offered, seller not ready | **No** — Connect guidance |
| `missing_settlement_path` | No settlement affordance | Report only |

---

## 2. Canonical mapping (10C.2)

All proposals flow through `proposeProductNormalization()`:

```
legacy category → legacyUrlCategoryToMarketplace()
subcategory/specs → normalizeTaxonomyIds() / toCanonicalTaxonomyId()
acceptedSpecializations → normalizeAcceptedTaxonomyIds()
listingKind → deriveListingKind()
canonical category → prismaCategoryToCanonical()
settlement → resolveSettlementOptions()
view intent → isMarketplaceSaleItem / isRequestListing
```

No parallel mapping tables introduced.

---

## 3. Category backfill (10C.3)

| Legacy signal | Target `marketplaceCategory` |
|---------------|------------------------------|
| CHEFF / meal / create.* | CREATE |
| GROWN / garden / grow.* | GROW |
| DESIGNER / design.* (physical) | DESIGN |
| practical.* / knowledge.* / artistic service | PRACTICAL_SERVICE / KNOWLEDGE / ARTISTIC_SERVICE |

Service taxonomy ids are inferred **without** category filter first (`normalizeTaxonomyIds(raw, null)`), so misclassified CREATE rows with `practical.*` subcategories are repaired.

Legacy `category` (CHEFF/GROWN/DESIGNER) is synced via `marketplaceToProductCategory()` after `marketplaceCategory` fix.

---

## 4. Intent backfill (10C.4)

- Default `listingIntent` = `OFFER` (schema default).
- `REQUEST` when `isRequestListing()` and stored intent wrong.
- **Price does not determine intent** — `priceCents=0` + `ON_REQUEST` remains OFFERED when offered.
- Inspiration remains on Dish feed path, not Product backfill.

---

## 5. Settlement backfill (10C.5)

- Explicit booleans always win.
- Only auto-fix: `orderMethod=CONTACT` with default `acceptHomeCheffPayment=true` + `acceptDirectContact=false` (pre-boolean migration artifact).
- Stripe Connect readiness is **audited**, not written on Product.
- Barter and accepted values preserved; normalized ids only.

---

## 6. Accepted values backfill (10C.6)

- Official taxonomy ids preserved.
- `pending:*` ids preserved (`normalizeAcceptedTaxonomyIds`).
- Legacy strings mapped where `toCanonicalTaxonomyId` / accepted-value registry allows.
- Unmapped values reported in audit JSON — **never deleted**.

---

## 7. Filter preference audit (10C.7)

| Surface | State | Canonical alignment |
|---------|-------|---------------------|
| View chips | `feedChip`: all / sale / gezocht / inspiration | Maps to OFFERED / WANTED / INSPIRATION — **no services view** |
| Category chips | `appliedCategory`: cheff / garden / designer / services | Maps to FOOD / GARDEN / CREATIONS / SERVICES |
| Ik zoek / Ik bied | `DiscoveryDirectionToggle` | offer vs want — separate from category |
| Accepted values | `appliedAcceptedValues[]` | `accepted-values-discovery.ts` |
| Radius / location | `appliedScope`, `appliedRadius`, coords | Unchanged |
| Sort / price / refine | client-only filters | Unchanged |

**Verified:** No `feedChip === 'services'` bug. Legacy `?chip=services` migrated in `app/page.tsx` and `GeoFeed.tsx` via `migrateLegacyServicesViewChip()`.

**Known architecture (unchanged):** `vertical=services` is client-filtered via `isMarketplaceServiceItem()` — server `resolveProductCategory` returns null for services slug.

---

## 8. URL + session migration (10C.8)

| Legacy | Migrated to |
|--------|-------------|
| `?chip=services` | `chip=sale` + `category=services` |
| `?chip=sale` / `aanbod` / `shop` | `feedChip=sale` (OFFERED) |
| `?vertical=cheff` / `food` | `category=cheff` |
| `?vertical=services` / `diensten` | `category=services` |
| Persisted `hc_feed_surfaces_v2` | `migrateHomeFeedPersist()` strips legacy radius keys |

Backward compatibility preserved in homepage deep-link resolver.

---

## 9. Dry-run results (10C.9)

```bash
npx tsx scripts/audit-marketplace-data-normalization-phase10c.ts
npx tsx scripts/backfill-marketplace-data-normalization-phase10c.ts --dry-run
```

**Local dry-run (2026-07-08):** 5 products would update — `specializations` + `subcategory` normalized from legacy `subcategory` slugs (`create.art`, `design.website`, etc.). 2 skipped (already canonical or audit-only).

Full machine-readable report: `docs/audits/phase10c-normalization-audit-latest.json` (generated, not committed).

---

## 10. Write-mode instructions (10C.10)

```bash
# 1. Audit
npx tsx scripts/audit-marketplace-data-normalization-phase10c.ts

# 2. Dry-run backfill
npx tsx scripts/backfill-marketplace-data-normalization-phase10c.ts --dry-run

# 3. Apply (production: backup DB first)
CONFIRM_BACKFILL=1 npx tsx scripts/backfill-marketplace-data-normalization-phase10c.ts --write

# Optional: single product or limit
npx tsx scripts/backfill-marketplace-data-normalization-phase10c.ts --dry-run --id=<uuid>
npx tsx scripts/backfill-marketplace-data-normalization-phase10c.ts --dry-run --limit=100
```

**Rollback:** Per-product inverse patch from dry-run log. No deletes. Re-run audit after write to confirm idempotency (0 updates).

---

## 11. UI verification (10C.11)

After write on target environment:

- [ ] Category filters: Food / Garden / Creations / Services match derived `listingKind`
- [ ] Offered includes on-request, barter, €0 service offers
- [ ] Services pillar shows SERVICE/TASK/WORKSHOP/COACHING items
- [ ] Wanted shows REQUEST intent rows
- [ ] Inspiration unchanged (Dish path)
- [ ] Reverse discovery + accepted-value chips on old and new rows
- [ ] Tiles show correct settlement row icons via `resolveSettlementOptions`

---

## 12. Deferred items

| Item | Reason |
|------|--------|
| Server-side `vertical=services` Prisma filter | Architecture unchanged — client filter by design |
| Persisted `listingKind` column | Derived at runtime per ADR |
| Dish → Product migration | Out of scope — separate inspiration model |
| Auto-fix `checkout_needs_stripe_connect` | Seller Connect flow, not data normalization |
| Unmapped raw strings (e.g. `CHEFF` in specs array) | Manual review or seller re-edit |
| Legacy Listing model backfill | 0 rows locally; transform at API read |

---

## 13. USP visibility — reverse discovery (10C.13)

**Problem:** Reverse discovery and value exchange were functionally present but felt like an advanced/hidden filter (accepted values under “Meer filters” in want mode).

**Shipped (copy + placement only — no redesign):**

| Surface | Change |
|---------|--------|
| Homepage hero | `heroValueExchange` USP line (NL/EN) |
| Left sidebar filters | USP tagline + accepted-values filter always visible (both Ik zoek / Ik bied) |
| Mobile filter sheet | Same promotion as desktop |
| Discovery direction toggle | Tagline + education for both want and offer |
| Feed chip intro | Mentions value shopping |
| Empty states | Hints to try Ik bied / I offer |
| Guest discover panel | Value-exchange bullets |
| Create/edit form | `settlementIntro` before payment method checkboxes |
| Listing detail settlement | Updated intro copy |
| Onboarding filter hint | Reverse discovery explained |

**Example copy (NL):** “Shop niet alleen met geld. Ontdek wat je kunt krijgen met wat jij kunt aanbieden.”

---

## Architecture confirmation

Unchanged: canonical-model, settlement-router, reverse discovery, taxonomy SSOT, tile pipeline, ranking, payment flows.
