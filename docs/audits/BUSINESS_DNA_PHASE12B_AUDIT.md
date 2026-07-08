# Business DNA & Subscription Experience — Phase 12B Audit

**Date:** 2026-07-08  
**Method:** Expand Phase 12A visibility SSOT into complete Business DNA; audit subscription surfaces; growth-first UX on `/sell`; verify commission consistency and affiliate compatibility. No redesign. No new billing system.

---

## Executive summary

Phase 12B completes the **Business DNA** model: one SSOT (`lib/business/visibility-profile.ts`) defines commission, visibility, ranking, badges, analytics, permissions, and future feature flags. The `/sell` page now sells **growth and visibility**, not commission discounts. Automatic activation path (Stripe → webhook → profile → ranking → badges → analytics) remains fully automated.

| Area | Verdict |
|------|---------|
| Business DNA SSOT | ✅ Complete |
| Growth subscription UX | ✅ `/sell` comparison + cards |
| Commission 12/9/7/5% | ✅ Single source |
| Affiliate compatibility | ✅ Transaction fee based |
| Ranking fairness | ✅ Capped boost unchanged |
| Future modules | ✅ Flags only |
| Backwards compatibility | ✅ Legacy feeBps mapped |

---

## 1. Business DNA SSOT

**Module:** `lib/business/visibility-profile.ts`

**Entry points:**
- `getBusinessVisibilityProfile(input)` — primary SSOT
- `getBusinessDnaProfile(input)` — alias (same function)
- `resolvePlatformFeePercent(input)` / `resolvePlatformFeeBps(input)`

**DNA fields exposed per plan:**

| Field | Purpose |
|-------|---------|
| `commissionPercent` | Marketplace fee (alias `feePercent`) |
| `rankingBoost` | Capped sum of boost weights |
| `discoveryBoost` | Visibility multiplier |
| `badge` | Business / Pro / Premium |
| `analyticsLevel` + `analyticsDisplayKey` | Analytics tier + UI label |
| `homepageEligible` / `homepageSpotlightEligible` | Homepage modules |
| `regionalEligible` / `regionalCampaignEligible` | Regional growth |
| `websiteVisible` / `socialPromotion` | Future promotion |
| `campaignBuilder` | Campaign eligibility |
| `verifiedBusiness` / `localSearchPriority` | Trust + search |
| `multipleLocations` / `maxLocations` | Location limits |
| `prioritySupport` | Support tier |
| `futureAiMarketing` / `futureBusinessApi` / `futureFranchiseSupport` | Not implemented |

**Rule enforced:** No `if (plan === 'premium')` or `feeBps === 700` outside SSOT (validator grep).

---

## 2. Subscription philosophy

**Before 12B:** `/sell` emphasized lower platform fee.  
**After 12B:** Headline = grow faster; pillars = visibility, trust, customers, automation. Commission shown as footnote on cards and one row in comparison table.

---

## 3. Plan tiers (DNA config)

| Plan | Commission | Growth highlights |
|------|------------|-------------------|
| Individual | 12% | Standard visibility, basic analytics, 1 location |
| Basic | 9% | Badge, verified business, light boost, local search |
| Pro | 7% | Stronger boost, category featured, regional, 2 locations, homepage eligible |
| Premium | 5% | Max boost, spotlight eligible, regional campaigns, unlimited locations, future AI/API |

Pro updates in 12B: `homepageEligible: true`, `regionalEligible: true`, `maxLocations: 2`.

---

## 4. Subscription presentation (`/sell`)

| Component | Role |
|-----------|------|
| `SubscriptionPlanCards` | Growth benefits from `growthBenefitKeysForPlan()` |
| `SubscriptionComparisonTable` | 13-row matrix from `buildSubscriptionComparisonRows()` |
| i18n `business.dna.*` | NL + EN growth copy |

Comparison includes Individual column so owners see the full ladder.

---

## 5. Automatic activation chain

```
Stripe Checkout / subscription.update
  → webhook (checkout.session.completed | customer.subscription.updated)
  → SellerProfile.subscriptionId + subscriptionValidUntil
  → getBusinessVisibilityProfile() on read
  → Trust snapshot businessPlan
  → boundedBusinessVisibilityRankBoost
  → BusinessPlanBadge + tile badges
  → analyticsLevel on dashboard API
  → Seller dashboard fee display
```

No admin step required.

---

## 6. Affiliate compatibility

Affiliate user commissions = % of **HomeCheff platform fee** on transactions (`homecheffFeeCents`).  
That fee is computed at checkout/webhook using `getBusinessVisibilityProfile()` → affiliate automatically uses 12/9/7/5% without separate affiliate fee tables.

Business subscription affiliate = % of subscription invoice (unchanged; independent of marketplace commission %).

---

## 7. Commission SSOT audit

| Surface | Uses SSOT? |
|---------|------------|
| `lib/stripe.ts` | ✅ |
| `app/api/stripe/webhook/route.ts` | ✅ |
| `app/api/seller/dashboard/stats/route.ts` | ✅ |
| `app/api/seller/earnings/route.ts` | ✅ (12B) |
| `app/api/earnings/combined/route.ts` | ✅ (12B) |
| `app/api/earnings/export/route.ts` | ✅ |
| `app/api/seller/payouts/request/route.ts` | ✅ |
| `components/ui/BusinessBadge.tsx` | ✅ (12B) |
| `lib/affiliate-commission.ts` | ✅ via transaction fee |
| `app/api/admin/financial/route.ts` | PLATFORM_FEES 9/7/5; subscription revenue by plan name |

---

## 8. Ranking

Unchanged from 12A:
- `boundedBusinessVisibilityRankBoost()` only in baseline profile
- Cap `BUSINESS_VISIBILITY_RANK_CAP = 0.08`
- Distance, trust, recency, category filters dominant

Premium has highest `rankingBoost` within cap.

---

## 9. Analytics tiers

| Display | Individual | Basic | Pro | Premium |
|---------|------------|-------|-----|---------|
| Label | Basis | Business | Geavanceerd | Premium |

Individual `analyticsLevel` set to `basic` for minimal metrics (views). Gates in `analytics-tier.ts` + `/verkoper/analytics`.

---

## 10. Future-ready flags

Prepared in DNA, not implemented:
- Website / social promotion (`websitePromotionStatus`, `socialPromotionStatus`)
- Homepage spotlight (Premium `homepageSpotlightEligible`)
- Campaign builder / regional campaigns
- AI marketing, business API, franchise support

---

## 11. Findings

| ID | Sev | Finding |
|----|-----|---------|
| DNA1 | P2 | `/pricing` legacy page still fee-oriented | Redirect to `/sell` later |
| DNA2 | P2 | Stripe Customer Portal not enabled | Cancel API sufficient |
| DNA3 | P2 | Future promotion modules flags only | By design |
| DNA4 | P1 | Production DB `feeBps` may be stale | Run seed once |

**P0:** None.

---

## 12. Success criteria

| Criterion | Met? |
|-----------|------|
| Owner understands what each plan delivers | ✅ Comparison + growth cards |
| Choice based on growth not commission | ✅ UX repositioned |
| Full lifecycle automated via one SSOT | ✅ |
| Backwards compatible | ✅ Legacy feeBps mapping |
| Affiliate + payouts consistent | ✅ |

---

## Validation

```bash
npx tsx scripts/validate-business-dna-phase12b.ts
npm run lint
npm run build
```
