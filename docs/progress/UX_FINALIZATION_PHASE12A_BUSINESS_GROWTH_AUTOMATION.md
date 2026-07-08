# UX Finalization — Phase 12A Business Growth Automation

**Date:** 2026-07-08

## Goal

Make business subscriptions self-service: correct fees (9/7/5%), centralized visibility benefits, capped discovery boost, plan badges, and analytics tiers — without redesign or duplicate systems.

## Delivered

| Artifact | Purpose |
|----------|---------|
| `docs/audits/BUSINESS_GROWTH_AUTOMATION_PHASE12A_AUDIT.md` | Full subscription + visibility + automation audit |
| `lib/business/visibility-profile.ts` | SSOT for plan fees, boosts, badges, analytics, future eligibility |
| `lib/business/analytics-tier.ts` | Analytics metric gates (real data only) |
| `lib/discovery/ranking/business-visibility-boost.ts` | Capped additive ranking boost (baseline profile) |
| `components/business/BusinessPlanBadge.tsx` | Subtle Business / Pro / Premium chip |
| `app/api/subscribe/cancel/route.ts` | Self-service cancel at period end |
| `scripts/validate-business-growth-automation-phase12a.ts` | Phase guard (chains 11B + 11A) |

## Commission model (12A)

| Plan | Monthly | Platform fee | Visibility |
|------|---------|--------------|------------|
| Individual | €0 | 12% | Organic |
| Basic | €39 | **9%** | Light boost + business badge |
| Pro | €99 | **7%** | Stronger boost + category priority |
| Premium | €199 | **5%** | Highest boost + regional/homepage eligibility flags |

## Key wiring

| Area | Change |
|------|--------|
| Fees | `visibility-profile.ts` → `lib/stripe.ts`, `lib/pricing.ts`, seeds, admin financial, webhook payouts, dashboard stats, earnings export |
| Ranking | `business-visibility-boost` in baseline profile only; cap 0.08 |
| Trust | `fetch-seller-trust-snapshots` sets `businessPlan` on discovery trust |
| Badges | Tiles, profile header, product detail trust block |
| Analytics | Dashboard API returns `analyticsLevel`; `/verkoper/analytics` gates metrics |
| Webhook | `past_due` keeps benefits; revoke on `canceled` / `unpaid` / `incomplete_expired` |

## Architecture

Unchanged — `canonical-model.ts`, `settlement-router.ts`, `settlement-options.ts`, existing Stripe Billing + `SellerProfile` / `BusinessSubscription` model.

## Validation

```bash
npx tsx scripts/validate-business-growth-automation-phase12a.ts
npx tsx scripts/validate-follow-the-money-phase11b.ts
npx tsx scripts/validate-release-candidate-phase11a.ts
npm run lint
npm run build
```

## Automation verdict

| Question | Answer |
|----------|--------|
| Subscribe without admin? | **Yes** — `/sell` → Stripe Checkout → webhook assigns plan |
| Fees consistent? | **Yes** — 9/7/5% via SSOT |
| Visibility centralized? | **Yes** — `getBusinessVisibilityProfile()` |
| Ranking fair? | **Yes** — capped boost; filters/trust/distance unchanged |
| Premium social/website live? | **No** — eligibility flags only |
| Production DB feeBps? | **Run seed** — `prisma/seed-subscriptions.js` updates rows |

## Deferred

- Stripe Customer Portal (upgrade/downgrade UI beyond `/sell`)
- Homepage / regional spotlight modules (eligibility prepared)
- Premium social promotion
- Regional reach / campaign analytics (not in DB yet)
- Automated growth notification loops (audited; use existing surfaces)
