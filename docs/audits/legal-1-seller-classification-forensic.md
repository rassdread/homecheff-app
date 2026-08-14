# LEGAL-1 — Forensic baseline (Phase 0, read-only)

**Main SHA before:** `056fddffb3e8d03fbcd6beeb793c07e69803cbc1`  
**Production deployment before:** `dpl_B9FE82NJonCfU6diw3B7DaiXS39p` (homecheff.eu)  
**Date:** 2026-08-14

## Current business-status owners

| Surface | Owner | Meaning today |
|--------|--------|----------------|
| Feed / listing APIs | `SellerProfile.kvk && SellerProfile.companyName` → `isBusiness` | Registered business **information present** (not legal trader) |
| Registration | Request body `isBusiness` | Creates `Business` + SellerProfile company fields; affiliate attribution flag |
| `Business.verified` | Column `@default(false)` | Set `false` on register; **no production write path sets `true`** |
| DNA “Verified” badge | `lib/business/visibility-profile.ts` `verifiedBusiness` | **Plan-tier marketing**, not DSA / KvK verification |
| Stripe | `User.stripeConnectAccountId` + status API `business_type` | Connect KYC; not HomeCheff trader declaration |

## Exact current `isBusiness` logic

```ts
Boolean(seller.kvk && seller.companyName)
```

### Important consumers (do not globally rename)

- `app/api/feed/route.ts` — feed card badge input (**FEED FREEZE — leave semantics**)
- `app/api/products/feed/route.ts`, `app/api/products/route.ts`, `app/api/products/[id]/route.ts`
- `lib/marketplace/detail/load-listing-detail.ts` → mapper → ProductMakerTrustStrip / BusinessBadge (“Bedrijf”)
- `components/ItemCard.tsx` — BusinessBadge when `isBusiness`
- Registration / affiliate: body flag ≠ legal trader
- Admin user contact displays companyName/kvk as facts

**If meaning changed to “legal trader”:** feed badges, trust strips, and listing detail would mislabel neighbours who merely filled company fields.

## Dependency map (concepts)

- **KvK / companyName / btw** — SellerProfile (+ Business on business signup)
- **Professional / bedrijf badge** — driven by `isBusiness` approximation + subscription DNA
- **Stripe account type** — read in seller stripe status; not persisted as HomeCheff declaration
- **Food / service** — Product `category` / `marketplaceCategory` (derived activity later)
- **Tax checkbox** — `User.taxResponsibilityAccepted` (separate acceptance, not trader enum)
- **Feed freeze** — no GeoFeed / CTA / endless / radius changes in LEGAL-1

## Schema decision (Phase 2)

- **Canonical owner:** `SellerProfile` (one owner for seller commerce state)
- **Migration:** YES — additive columns only; defaults `UNDECLARED` / `NONE`; **no row backfill** of private/professional
- **Activities:** derived in helper (not stored) from listing facts
- **Legacy `isBusiness`:** preserved as `registeredBusinessInfoPresent` alias; feed still uses kvk&&companyName
