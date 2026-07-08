# UX Finalization — Phase 12B Business DNA

**Date:** 2026-07-08

## Goal

Transform subscriptions into a **Business DNA** architecture: businesses subscribe for growth, visibility, and automation — commission is secondary. One SSOT, growth-focused `/sell` UX, full backwards compatibility.

## Delivered

| Artifact | Purpose |
|----------|---------|
| `docs/audits/BUSINESS_DNA_PHASE12B_AUDIT.md` | Full DNA + subscription experience audit |
| `lib/business/visibility-profile.ts` | Expanded Business DNA SSOT (flags, aliases, future modules) |
| `lib/business/subscription-comparison.ts` | Comparison table rows derived from DNA |
| `components/business/SubscriptionComparisonTable.tsx` | Professional feature comparison |
| `components/business/SubscriptionPlanCards.tsx` | Growth-focused plan cards from SSOT |
| `scripts/validate-business-dna-phase12b.ts` | Phase guard (chains 12A) |

## Business DNA SSOT

All plan benefits flow through `getBusinessVisibilityProfile()` / `getBusinessDnaProfile()`:

- `commissionPercent` (12 / 9 / 7 / 5)
- `rankingBoost`, `discoveryBoost`, `badge`, `analyticsLevel`
- Eligibility: homepage, regional, website, social, campaigns
- Future flags: AI marketing, business API, franchise (not implemented)
- `maxLocations`: 1 / 1 / 2 / unlimited

## Subscription UX (`/sell`)

- Headline sells **growth** (visibility, trust, customers, automation)
- Plan cards show purpose, growth benefits, commission as footnote
- Full comparison table: Individual + Basic + Pro + Premium
- No fee-first copy; commission is one comparison row

## Commission wiring (SSOT)

Updated to use `getBusinessVisibilityProfile()`:

- `app/api/seller/earnings/route.ts`
- `app/api/earnings/combined/route.ts`
- `components/ui/BusinessBadge.tsx`

(Affiliate continues via `homecheffFeeCents` on transactions — already SSOT-driven at checkout.)

## Architecture

Unchanged — Stripe Billing, `SellerProfile`, settlement router, canonical model, ranking cap 0.08.

## Validation

```bash
npx tsx scripts/validate-business-dna-phase12b.ts
npm run lint
npm run build
```

## Success criteria

| Criterion | Met? |
|-----------|------|
| One Business DNA SSOT | ✅ |
| Growth-first subscription UX | ✅ |
| 12/9/7/5% everywhere | ✅ |
| Affiliate compatible | ✅ |
| Automatic activation path | ✅ |
| Future flags prepared | ✅ |
| No duplicate plan logic | ✅ |

## Deferred

- Stripe Customer Portal
- Live homepage spotlight / regional campaigns
- Website & social promotion modules
- AI marketing, business API, franchise
