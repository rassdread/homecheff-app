# Business Growth Automation — Phase 12A Audit

**Date:** 2026-07-08  
**Method:** End-to-end audit of business subscription flow, commission model, visibility engine, ranking integration, badges, analytics tiers, self-service billing, growth loops, and automation readiness. Architecture frozen (Phases 7A–11C). No redesign.

---

## Executive summary

Phase 12A centralizes business subscription value in **`lib/business/visibility-profile.ts`** and updates the commission model to **Basic 9% / Pro 7% / Premium 5%** (individual 12%). Businesses can subscribe, pay, upgrade, downgrade, and cancel **without admin intervention**. Discovery ranking applies a **bounded** visibility boost in the baseline profile only — it does not override distance, relevance, trust, or category filters.

| Area | Verdict | Notes |
|------|---------|-------|
| Subscription checkout | ✅ Live | `/sell` → `/api/subscribe` → Stripe Billing |
| Plan activation | ✅ Automated | Webhook assigns `subscriptionId` + `subscriptionValidUntil` |
| Commission fees | ✅ Updated | SSOT 9/7/5%; legacy `feeBps` mapped at read time |
| Visibility benefits | ✅ Centralized | `getBusinessVisibilityProfile()` |
| Ranking boost | ✅ Safe | Cap 0.08; baseline profile only |
| Badges | ✅ Wired | Profile, detail trust, tiles |
| Analytics tiers | ⚠️ Partial | Gates real metrics; premium metrics deferred |
| Growth loops | ⚠️ Partial | Notifications/HCP exist; no subscription-specific drips |
| Premium social/website | 🔜 Flags only | Eligibility in profile; not promoted yet |

**Quick wins applied in 12A:**
1. `lib/business/visibility-profile.ts` — SSOT for fees, boosts, badges, analytics, future flags
2. Commission model 12/9/7/5% across pricing, seeds, i18n, admin financial, payout paths
3. Capped `boundedBusinessVisibilityRankBoost` in baseline ranking
4. `POST /api/subscribe/cancel` — self-service cancel at period end
5. Webhook `past_due` grace — benefits kept until `canceled` / `unpaid` / `incomplete_expired`
6. Analytics tier gates on seller dashboard + `/verkoper/analytics`

---

## Severity legend

| Level | Meaning |
|-------|---------|
| **P0** | Blocks self-service business growth |
| **P1** | Important before scaling paid plans |
| **P2** | Improve after pilot |
| **P3** | Long-term optimisation |

---

## 1. Current business subscription flow audit

### Surfaces audited

| Surface | Path | Status |
|---------|------|--------|
| Sell / subscribe UI | `/sell` | ✅ Plan cards, Stripe checkout, confirm redirect |
| Pricing reference | `/pricing` | ⚠️ Legacy tier UI (`/api/user/upgrade`); **not** primary billing path |
| Subscribe API | `POST /api/subscribe` | ✅ Auth + ownership; upgrade via `subscriptions.update` |
| Confirm API | `GET/POST /api/subscribe/confirm` | ✅ Session ownership; assigns local plan |
| Cancel API | `POST /api/subscribe/cancel` | ✅ **12A** — `cancel_at_period_end` |
| Stripe webhook | `app/api/stripe/webhook/route.ts` | ✅ Checkout, update, delete, invoice |
| SellerProfile fields | `subscriptionId`, `subscriptionValidUntil`, `stripeSubscriptionId` | ✅ |
| Subscription table | `Subscription` (Basic/Pro/Premium) | ✅ `feeBps` 900/700/500 in seeds |
| Dashboard visibility | Seller ops shell, stats API | ✅ Fee % from visibility profile |
| Feature gates | Profile tabs, contact premium, analytics | ✅ Read subscription / plan |
| Role quick links | Onboarding, `/sell`, verkoper shell | ✅ |
| Seller onboarding | KVK + company in profile settings | ✅ Required before business positioning |

### What already works (no admin)

1. User registers → completes seller profile (KVK optional for individual selling)
2. Visits `/sell` → chooses Basic/Pro/Premium → Stripe Checkout
3. `checkout.session.completed` (subscription mode) → assigns `subscriptionId`, `stripeSubscriptionId`, `subscriptionValidUntil`
4. `customer.subscription.updated` → upgrade/downgrade sync; revoke only on terminal statuses
5. `customer.subscription.deleted` → clears subscription fields
6. Platform fee on orders uses visibility SSOT (webhook payout path)
7. Discovery trust snapshot includes `businessPlan` for ranking + badges

### What still needs manual / ops action

| ID | Severity | Item | Manual? |
|----|----------|------|---------|
| SUB1 | P2 | `/pricing` page uses legacy `PRICING_TIERS` + `/api/user/upgrade` — parallel to Stripe Billing | Confusing, not blocking |
| SUB2 | P2 | Stripe Customer Portal not enabled — cancel via API only | Self-service OK via `/sell` + cancel route |
| SUB3 | P1 | **Production DB** may have old `feeBps` (700/400/200) until seed/migration run | One-time ops |
| SUB4 | P2 | Admin can still edit `feeBps` in admin settings | Override path, not required for activation |
| SUB5 | P3 | KVK verification not automated | Business badge shows on active subscription, not KVK audit |

---

## 2. New subscription strategy

### Commission model (12A)

| Plan | Price | Fee | Value proposition |
|------|-------|-----|-------------------|
| Individual | €0/mo | 12% | Organic visibility |
| Basic | €39/mo | **9%** | Business profile, badge, light boost, basic analytics |
| Pro | €99/mo | **7%** | Stronger boost, category priority, pro analytics, campaign eligibility |
| Premium | €199/mo | **5%** | Highest boost, regional/homepage eligibility, premium badge, advanced analytics flags |

**Design principle:** Subscription value is **visibility and growth**, not only commission discount. Premium at 5% still yields healthy platform revenue at scale.

### Sources of truth

- `lib/business/visibility-profile.ts` — `PLAN_CONFIG`
- `lib/pricing.ts`, `lib/stripe.ts`, `prisma/seed-subscriptions.js`, `scripts/create-subscriptions.js`
- `public/i18n/nl.json` + `en.json` — fee summary copy

Legacy `feeBps` (700/400/200) mapped to plan ids at read time via `LEGACY_FEE_BPS_TO_PLAN`.

---

## 3. Business Visibility Engine

**Module:** `lib/business/visibility-profile.ts`

**API:** `getBusinessVisibilityProfile(userOrSellerProfile | BusinessPlanId)`

Returns: `plan`, `feeBps`, `visibilityMultiplier`, `feedBoost`, `searchBoost`, `categoryBoost`, `nearbyBoost`, `recommendationBoost`, `homepageEligible`, `regionalEligible`, `categorySpotlightEligible`, `trendingEligible`, `businessBadge`, `premiumBadge`, `analyticsLevel`, `websiteVisible`, `socialsVisible`, `campaignEligible`, `multipleLocationsEligible`.

**Consumers (12A):**
- `lib/stripe.ts` — `BUSINESS_PLATFORM_FEES`
- `app/api/seller/dashboard/stats/route.ts`
- `app/api/stripe/webhook/route.ts` — order platform fee
- `app/api/earnings/export/route.ts`, `app/api/seller/payouts/request/route.ts`
- `lib/discovery/trust/fetch-seller-trust-snapshots.ts`
- `lib/discovery/ranking/business-visibility-boost.ts`
- `lib/marketplace/tiles/build-tile-badges.ts`

**Rule:** No scattered plan checks for fees or visibility — extend SSOT only.

---

## 4. Ranking integration audit

### Ranking surfaces

| Surface | Engine | Business boost (12A) |
|---------|--------|----------------------|
| Geo feed | `rankDiscoveryItems` baseline | ✅ Capped additive |
| Discovery sections | Profile-specific (`trusted_maker`, `top_rated`, `trending`, `nearby`) | ❌ No paid boost (trust/evidence only) |
| Search | Baseline sort when ranked | ✅ Via trust snapshot |
| Category sections | Filter + baseline | ✅ Cannot bypass category filter |
| Recommendations | Baseline / growth bundles | ✅ Bounded |
| Sidebar / homepage promos | `home-promotions.ts`, growth surfaces | ❌ Not auto-boosted by plan (eligibility flags only) |
| Seller profile listings | Profile sort | Organic |
| Related listings | Baseline | ✅ Bounded |

### Safety properties

- Boost applied in `baselineProfile.computeScore` only
- `BUSINESS_VISIBILITY_RANK_CAP = 0.08`
- Eligibility gates (`inactive_listing`, `spam_listing_tier0`) unchanged
- `trusted_maker` / `top_rated` / `trending` require evidence thresholds — paid plan cannot bypass

---

## 5. Safe visibility weighting

```
Final baseline score =
  distance × 0.35 +
  recency × 0.25 +
  sellerTier × 0.20 +
  favorites (capped) × 0.10 +
  completedDeals (capped) × 0.10 +
  boundedBusinessVisibilityRankBoost  // max 0.08
```

**Hard rules enforced:**
- Paid visibility cannot force unrelated results (boost is additive, small)
- Cannot bypass category filters (filter layer precedes ranking)
- Cannot bypass location logic (distance weight dominant)
- Cannot bypass trust/safety (tier-0 spam excluded)
- Cannot hide regular users (boost cap + organic weights)

---

## 6. Business badge system

| Surface | Component | Status |
|---------|-----------|--------|
| Marketplace tiles | `build-tile-badges.ts` | ✅ Plan label in trust area |
| Seller profile | `ProfileV2Header` + `BusinessBadge` (company) | ✅ `BusinessPlanBadge` added |
| Listing detail | `ProductDetailTrustBlock` | ✅ Subtle plan chip |
| Seller dashboard | Stats show `businessPlan` | ✅ |
| Subscription page | `/sell` plan cards | ✅ Fee + perks copy |

Existing `BusinessBadge` (company/KVK) retained for company identity; `BusinessPlanBadge` is the subtle plan indicator.

---

## 7. Analytics level

### Tier definitions

| Tier | Metrics exposed (when implemented) |
|------|-----------------------------------|
| none | — |
| basic | views, favorites |
| pro | + messages, conversion_rate, popular_listings |
| premium | + profile_visits, export |

### Data reality (12A)

| Metric | In DB/API today |
|--------|-----------------|
| views | ✅ `analyticsEvent` VIEW on products |
| favorites | ⚠️ Product favorite count exists; dedicated analytics card partial |
| messages | ⚠️ Not on stats API yet — tier defined, not faked |
| conversion_rate | ✅ orders/views on stats API |
| popular_listings | ❌ Not yet — tier gate ready |
| regional_reach, campaign_performance | ❌ Future — not exposed |

**Policy:** `analytics-tier.ts` documents `IMPLEMENTED_ANALYTICS_METRICS`; UI gates with `canAccessAnalyticsMetric`; upgrade CTA for `none` tier.

---

## 8. Self-service upgrade / downgrade / cancel

| Flow | Implementation | Admin needed? |
|------|----------------|---------------|
| Choose plan | `/sell` + `POST /api/subscribe` | No |
| Pay | Stripe Checkout subscription mode | No |
| Upgrade | `stripe.subscriptions.update` (proration) | No |
| Downgrade | Same update path | No |
| Cancel | `POST /api/subscribe/cancel` | No |
| Failed payment | `past_due` — benefits retained (12A grace) | No |
| Expired | Webhook clears on terminal status | No |
| Reactivation | New checkout on `/sell` | No |
| Webhook idempotency | Order/transaction guards (11B) | No |
| feeBps update | DB subscription row + SSOT read | No* |

\*Run `prisma/seed-subscriptions.js` once on production so DB `feeBps` matches 900/700/500.

---

## 9. Growth automation loops (audit)

| Trigger | Existing hook | Subscription-aware? |
|---------|---------------|---------------------|
| First listing | HCP, notifications | No drip |
| Profile completion | Onboarding analytics | No |
| First sale | `tryAwardFirstSaleForSeller` | No |
| First review | Review notifications | No |
| Visibility threshold | HCP badges | Indirect |
| Inactive period | — | ❌ Not automated |
| Subscription upgrade | Webhook only | ❌ No welcome email |
| Accepted-value match | Messaging | No |
| Gezocht match | Notifications | No |

**Recommendation (P2):** Use `NotificationService` + dashboard callouts; no new spam engine. `BusinessUpgradeCallout` already prompts KVK + subscribe.

---

## 10. Premium future readiness

Flags in `visibility-profile.ts` (not live promotion):

- `websiteVisible`, `socialsVisible` — Premium true
- `homepageEligible`, `regionalEligible`, `categorySpotlightEligible`, `trendingEligible`
- `campaignEligible`, `multipleLocationsEligible`
- `analyticsLevel: 'premium'` includes `export` metric slot

No premium social promotion implemented — config/eligibility only.

---

## 11. Financial integrity

### Fee audit

| Location | Basic | Pro | Premium |
|----------|-------|-----|---------|
| `visibility-profile.ts` | 9% | 7% | 5% |
| `lib/pricing.ts` | 9% | 7% | 5% |
| `lib/stripe.ts` | 9% | 7% | 5% |
| `seed-subscriptions.js` | 900 bps | 700 bps | 500 bps |
| `admin/financial` PLATFORM_FEES | 9 | 7 | 5 |
| i18n feeSummary | 9/7/5 | ✅ | ✅ |

**Removed:** Premium 2% references from product code and i18n. Legacy docs (`AFREKENFLOW_VERIFICATIE_RAPPORT.md`) may still mention old rates — historical only.

Settlement router and canonical marketplace model **unchanged**.

---

## 12. Automation readiness — full path

```
Visit site → register → /sell choose plan → Stripe pay
  → webhook activates subscriptionId + validUntil
  → profile (KVK/company) → Connect Stripe onboarding
  → create listing → visibility profile applied in trust + ranking
  → orders/proposals → webhook fee from SSOT → payout
```

| Step | Automated? |
|------|------------|
| Register | ✅ |
| Business plan + pay | ✅ |
| Profile + KVK | ✅ User self-service |
| Connect | ✅ Stripe Connect onboarding |
| Listing | ✅ |
| Visibility benefits | ✅ Trust snapshot + ranking |
| Orders | ✅ |
| Payout | ✅ Escrow + Connect (11B) |

**No manual admin required** for standard business activation.

---

## Findings summary

| ID | Sev | Finding | Status |
|----|-----|---------|--------|
| 12A-F1 | P1 | Production DB `feeBps` may be stale | Ops: run seed |
| 12A-F2 | P2 | `/pricing` legacy upgrade path | Document / redirect to `/sell` |
| 12A-F3 | P2 | No Stripe Customer Portal | Cancel API sufficient for now |
| 12A-F4 | P2 | Premium analytics metrics not in DB | Tier gates only real data |
| 12A-F5 | P2 | Growth loops not subscription-triggered | Future notifications |
| 12A-F6 | P3 | Homepage/regional spotlight not live | Eligibility prepared |

**P0 blockers:** None for self-service business subscriptions.

---

## Success criteria (Phase 12A)

| Criterion | Met? |
|-----------|------|
| Businesses subscribe without admin | ✅ |
| Fees 9/7/5% consistent | ✅ |
| Subscriptions activate visibility profile | ✅ |
| Ranking/visibility centralized | ✅ |
| Premium earns healthy commission (5%) | ✅ |
| Plans sold as growth packages | ✅ (copy + boosts) |
| Platform prepared for automatic growth | ⚠️ Foundation laid; loops partial |

---

## Validation

```bash
npx tsx scripts/validate-business-growth-automation-phase12a.ts
npx tsx scripts/validate-follow-the-money-phase11b.ts
npx tsx scripts/validate-release-candidate-phase11a.ts
npm run lint
npm run build
```
