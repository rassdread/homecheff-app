# Phase 13B Audit — Operations Dashboard Intelligence

**Date:** 2026-07-08  
**Scope:** Founder-level audit of every operational dashboard (seller, affiliate, delivery, analytics, admin) for autonomous platform operation.  
**Rules:** No fake metrics. No architecture redesign. Reuse existing SSOTs only.

---

## Executive verdict (summary)

| Surface | Verdict | Can operate without founder? |
|---------|---------|------------------------------|
| **Seller dashboard** | **Partially ready** | Day-to-day selling yes; growth/discovery optimization no |
| **Affiliate dashboard** | **Not ready for independent growth** | Commissions visible; funnel and attribution gaps block scale |
| **Delivery dashboard** | **Partially ready** | Courier ops yes; business analytics and dual-role ops no |
| **Analytics (cross-role)** | **Fragmented** | Each role has snapshots, not decision-grade KPIs |
| **Admin command center (13A)** | **Founder-usable baseline** | Monitoring yes; several ops signals still `tracked: false` |
| **Overall operations readiness** | **Pilot-capable, not autonomous** | Founder intervention still required for growth, attribution disputes, and cross-role consistency |

**Pilot autonomy answer:** HomeCheff can run a **limited pilot** (sellers fulfilling orders, couriers delivering, affiliates sharing links) but **cannot operate largely autonomously** until P0/P1 gaps below are closed — especially affiliate attribution contract consistency, seller discovery analytics honesty, and delivery/admin ops visibility.

---

## SSOT reference map (reused, not duplicated in this audit)

| Domain | SSOT | Used correctly where |
|--------|------|---------------------|
| Business plan / fee / badges / analytics level | `lib/business/visibility-profile.ts` | Seller stats/earnings, checkout, webhook, admin command center |
| Settlement / checkout gates | `lib/marketplace/settlement/settlement-router.ts` | Checkout, product detail — **not** seller dashboard |
| Canonical marketplace model | `lib/marketplace/canonical-model.ts` | Feed/filters/tiles — **not** seller analytics |
| Affiliate commission math | `lib/affiliate-config.ts`, `lib/affiliate-commission.ts` | Ledger, payouts, affiliate dashboard |
| Affiliate attribution | `lib/affiliate-attribution.ts` | Register flows, referral API |
| Delivery fee split | `lib/fees.ts`, `lib/deliveryPricing.ts` | Delivery earnings, checkout |
| Discovery trust | `lib/discovery/trust/fetch-seller-trust-snapshots.ts` | Marketplace tiles — **not** seller dashboard |
| Admin financial overview | `app/api/admin/financial/route.ts` | Admin financial tab (transaction-based fees) |

---

# PART 1 — Seller Dashboard Intelligence

**Surfaces audited:** `/verkoper/dashboard`, `/verkoper/orders`, `/verkoper/analytics`, `/verkoper/revenue`, `/verdiensten`, `OperationsToday` seller card.  
**Primary APIs:** `app/api/seller/dashboard/stats`, `earnings`, `action-center`, `dashboard/products`, `dashboard/orders`.

## Metric coverage matrix

| Metric | Status | Evidence | Owner action visible? |
|--------|--------|----------|---------------------|
| Sales | `tracked: true` (partial) | Product sales via `dashboard/products`; no aggregate units-sold card | Export only |
| Orders | `tracked: true` | Stats + orders page + action center pending orders | Status updates, message buyer |
| Revenue | `tracked: true` | Stats, earnings, dashboard financial cards | Link to revenue page |
| Commission / platform fee | `tracked: true` | `getBusinessVisibilityProfile()` → `platformFeePercentage` in stats | Upgrade CTA |
| Subscription | `tracked: true` (partial) | `businessPlan`, DNA widget; no renewal/cancel/past_due | `/sell`, settings |
| Business DNA | `tracked: true` (config only) | `BusinessDnaDashboardWidget` — plan benefits, not live performance | Upgrade CTA |
| Visibility | `tracked: false` | Plan-derived score in DNA widget only; no impressions/rank | — |
| Discovery | `tracked: false` | No discovery diagnostics on verkoper surfaces | — |
| Views | `tracked: true` (partial) | `analyticsEvent` VIEW/PRODUCT in stats; top products use `sales * 10` estimate in products API | Analytics page (gated) |
| Favorites | `tracked: false` | Declared in `IMPLEMENTED_ANALYTICS_METRICS` but **not returned** by stats API | — |
| Followers | `tracked: false` | Only on public `api/seller/[sellerId]/stats` | — |
| Props | `tracked: false` | Workspace props not on verkoper dashboard | — |
| Messages | `tracked: false` (volume) | Unread count in action center only | Open messages |
| Conversion | `tracked: true` | `orders/views` in stats; shown on analytics for pro+ | — |
| Top listings | `tracked: true` | Top 5 by revenue on dashboard | — |
| Worst listings | `tracked: false` | No underperformer list | — |
| Recent activity | `tracked: true` (partial) | Recent orders only; no unified feed | — |
| Growth suggestions | `tracked: false` (data-driven) | Static plan upgrade CTAs only | Upgrade links |
| Stripe status | `tracked: true` | Action center + financial Stripe tab | Connect/onboard links |
| Payout status | `tracked: true` | Escrow, requestable amount, blocked reason in earnings | Request payout |
| Reviews | `tracked: true` (partial) | Average rating only; no count/recent/reply UI | — |
| Response rate | `tracked: false` | `computeSellerResponseTimeStats()` exists; public API only | — |
| Trust | `tracked: false` | Discovery trust bundles not surfaced to seller | — |
| Business badge | `tracked: true` (partial) | `BusinessPlanBadge` in DNA widget | — |
| Analytics quality | `tracked: false` (honest tier) | `analytics-tier.ts` overstates `IMPLEMENTED_ANALYTICS_METRICS` vs API | Upgrade banner |

## What information is missing (seller)

1. Discovery and visibility performance (feed placement, search, empty categories affecting seller).
2. Favorites, followers, message volume, response rate — social proof loop invisible to seller.
3. Worst/zero-view listings and actionable listing health.
4. Subscription lifecycle (renewal, past_due, cancellation).
5. Trust tier parity with what buyers see on tiles.
6. Honest `tracked: false` flags on analytics page for unimplemented tier metrics.

## Actions that should be immediately visible (already vs missing)

| Action | Today | Gap |
|--------|-------|-----|
| Complete Stripe Connect | ✅ Action center | — |
| Fulfill pending orders | ✅ Action center + orders | — |
| Request payout | ✅ Revenue/financial | — |
| Upgrade business plan | ✅ DNA widget + callout | — |
| Fix blocked listings | ✅ Action center (inactive payment products) | — |
| Reply to reviews | ❌ | No review inbox on verkoper |
| Improve low-performing listing | ❌ | No worst-listings panel |
| Complete subscription renewal issue | ❌ | No past_due surface |

## What should be automated (candidates)

| Automation | Priority | Rationale |
|------------|----------|-----------|
| Payout eligibility nudge when escrow releases | P2 | Reduces founder support |
| Surface zero-view / zero-sale listings | P1 | Seller self-serve growth |
| Wire `analyticsMetrics` with honest tracked flags | P1 | Stops misleading tier gates |
| Subscription renewal warnings | P1 | Revenue protection |
| Response-time badge from existing lib | P2 | Trust loop closure |

## Seller structural debt

- Revenue aggregated in 4+ routes (`stats`, `earnings`, `combined`, `products`, `export`) — same Stripe-filtered order math, no single ledger read.
- `settlement-router` and `canonical-model` not used on seller dashboards (acceptable if seller ops don't need buyer settlement UI).
- Orphan components: `SellerEarningsDashboard`, `FeeCalculator` (uses `lib/cart`, not DNA SSOT).

---

# PART 2 — Affiliate Growth Center

**Surfaces:** `/affiliate/dashboard`, `/affiliate/promo-codes`, `AffiliateQuickShareModal`, `PartnersGrowthWidget`, `ShareButton` + `useAffiliateLink`.

## Feature / metric matrix

| Capability | Status | Notes |
|------------|--------|-------|
| Referral links | `tracked: true` | `/welkom/{code}`, `/?ref=` → referral API |
| QR links | `tracked: true` | Dashboard + quick share modal (PNG/SVG/download/print) |
| Social share (WhatsApp/FB/IG/LinkedIn) | `tracked: true` (partial) | `ShareButton` on product/content; dashboard is copy-only |
| Email share | `tracked: true` (partial) | Via `ShareButton` mailto |
| Copy link | `tracked: true` | Dashboard + modal |
| Referral tracking (attributions) | `tracked: true` | `Attribution` rows at signup |
| Clicks | `tracked: false` | Referral API sets cookie only; no click log |
| Visits | `tracked: false` | — |
| Registrations | `tracked: true` | `totalReferrals` on dashboard |
| Verified users | `tracked: false` | No verification funnel metric |
| Orders (attributed count) | `tracked: false` | Commission via ledger only; no order count KPI |
| Subscriptions (attributed count) | `tracked: true` (partial) | `businessReferrals` count only |
| Pending commission | `tracked: true` | `CommissionLedger` PENDING |
| Available commission | `tracked: true` | AVAILABLE |
| Paid commission | `tracked: true` | PAID |
| Expected commission | `tracked: false` | No forward projection |
| Top campaigns | `tracked: false` | No campaign dimension on links |
| Top links | `tracked: false` | Single referral link per affiliate |
| Conversion % | `tracked: false` | No clicks → signup funnel |
| Lifetime value | `tracked: false` | — |
| Referral tree | `tracked: true` | Parent/child affiliates, sub-affiliate tab |
| Second-level referrals | `tracked: true` | Sub-affiliate hierarchy + parent commission splits |
| Monthly growth | `tracked: false` | Snapshot dashboard, no period charts |
| Growth recommendations | `tracked: false` | Passive income calculator only (client-side estimate) |
| Leaderboard | `tracked: false` | HCP leaderboard unrelated to affiliate performance |
| Gamification | `tracked: false` | No affiliate-specific gamification |
| Marketing materials | `tracked: true` (partial) | QR + landing FAQ; no flyer/PDF kit |
| Share texts | `tracked: true` (partial) | `appendAffiliateReferralToOutgoingText` helper |
| QR downloads | `tracked: true` | Client-side generation |

## What affiliates need to grow independently (gaps)

1. **Funnel analytics** — clicks, visits, signup conversion, attributed orders (P0 for growth).
2. **Campaign/link variants** — UTM or multi-link tracking (P1).
3. **Growth recommendations** from real data, not calculator (P2).
4. **Attributed order/subscription dashboards** with period comparison (P1).
5. **Marketing kit** beyond QR (P3).
6. **Affiliate leaderboard** (P3).

---

# PART 3 — Affiliate Attribution Contract Audit

**Implementation:** `lib/affiliate-attribution.ts`, `app/api/affiliate/referral/route.ts`, register hooks, `lib/affiliate-commission.ts`.

## Contract parameters (current)

| Parameter | Value | Source |
|-----------|-------|--------|
| Cookie name | `hc_ref` (stores **referral code**) | `affiliate-attribution.ts` |
| Cookie TTL | 30 days | `COOKIE_TTL_DAYS` |
| Attribution revenue window | 365 days | `ATTRIBUTION_WINDOW_DAYS` |
| Server cookie policy | First-touch (no overwrite if `hc_ref` exists) | `referral/route.ts` L34–47 |
| Client cookie policy | **Last-touch** (`setReferralCookie` always sets) | `affiliate-attribution.ts` L130–139 |
| Self-referral | Blocked at signup | `processAttributionOnSignup` |
| Duplicate signup attribution | Blocked if `USER_SIGNUP` or `BUSINESS_SIGNUP` exists | App-level, no DB unique on `userId` |
| Social login attribution | Deferred to `complete-social-onboarding` | Cookie must survive until onboarding |

## Scenario matrix

| Scenario | Current behavior | Expected (product) | Gap severity |
|----------|------------------|-------------------|--------------|
| A link → close browser → return → register (within 30d) | ✅ Attributed if `hc_ref` present at signup | First-touch wins | — |
| A link → cookie expires → register | ❌ No attribution | Policy-defined | P1 |
| Affiliate A → Affiliate B link → register (server path `?ref=`) | **A wins** (first-touch) | Often last-touch expected | P1 policy mismatch |
| Affiliate A → B via client `setReferralCookie` | **B overwrites A** | Inconsistent with server | **P0** |
| Affiliate A → organic Google → register | A wins if cookie present | Usually acceptable | — |
| Affiliate A → install app → register | Cookie on device that clicked; `ANDROID_BETA_DOWNLOAD` source if `hc_beta_src` set | Cross-install bridge | P1 |
| Desktop click → mobile register | ❌ No cross-device | Server-side click ID or account linking | **P0** |
| Google login → complete onboarding | Attributed if `hc_ref` at onboarding POST | Same | P1 (cookie TTL risk) |
| Self-referral | Blocked | Blocked | — |
| Duplicate referral (second signup attempt) | Skipped | Skipped | P2 (race without DB constraint) |
| QR code scan | Same as link (per-device cookie) | Same | — |
| Deep link `/welkom/{code}` | Server first-touch cookie + redirect | Same | — |
| Business signup via ref cookie only | `BUSINESS_SIGNUP` attribution created | Subscription commission needs `BusinessSubscription.attributionId` | **P0** |
| Business signup via promo on `/subscribe` | Attribution + Stripe metadata | Commissions flow | — |
| Order commission: buyer vs seller different affiliates | Buyer's affiliate wins single commission | Documented in `affiliate-commission.ts` | P2 (affiliate confusion) |

## Known code weaknesses

1. **P0 — `referral/route.ts` androidBeta bug:** If `hc_ref` already exists and `androidBeta=1`, `expires` is undefined when setting `hc_beta_src` (lines 49–56).
2. **P0 — Server first-touch vs client last-touch** conflict on `hc_ref`.
3. **P0 — Business ref-link signup does not wire subscription attribution** for invoice commissions without promo path.
4. **P1 — No click/visit persistence** for dispute resolution or affiliate trust.
5. **P1 — Google/social signup** attribution only at onboarding completion; 30-day cookie is sole bridge.
6. **P2 — No DB unique constraint** on `Attribution.userId` for signup types.

## Required fixes (classified)

| ID | Fix | Priority |
|----|-----|----------|
| ATT-01 | Unify cookie overwrite policy (server + client) | P0 |
| ATT-02 | Link `BUSINESS_SIGNUP` attribution to `BusinessSubscription.attributionId` on subscribe | P0 |
| ATT-03 | Fix `androidBeta` cookie `expires` when `hc_ref` exists | P0 |
| ATT-04 | Document/order commission priority for affiliates | P1 |
| ATT-05 | Add click logging (minimal) on referral API | P1 |
| ATT-06 | DB uniqueness or idempotent constraint on signup attribution | P2 |

---

# PART 4 — Delivery Operations Dashboard

**Surfaces:** `/delivery/dashboard`, `/delivery/settings`, `/delivery/instellingen`, `/bezorger/[username]`, admin `DeliveryManagement`.

## Capability matrix

| Area | Status | Notes |
|------|--------|-------|
| Courier dashboard | `tracked: true` | `DeliveryDashboard` + `api/delivery/dashboard` |
| Availability (days/times) | `tracked: true` | `DeliveryProfile` fields via settings API |
| Radius | `tracked: true` | `maxDistance` |
| Vehicle | `tracked: true` | Vehicle photos + type in settings |
| Working hours | `tracked: true` (partial) | `availableDays` / `availableTimeSlots`; `CourierAvailability` model unused in UI |
| Capacity | `tracked: false` | Not modeled for couriers |
| Delivery types | `tracked: true` (partial) | TEEN_DELIVERY pool + community `DeliveryRequest` tab |
| Routes | `tracked: true` (partial) | Distance sorting in dashboard API |
| Assignments | `tracked: true` | accept/claim flows |
| Escrow | `tracked: true` (indirect) | Released on delivered via `releaseEscrowOnDelivered` |
| Transfers / payouts | `tracked: true` | `api/delivery/earnings`, `delivery-payout.ts` |
| Reviews | `tracked: true` (partial) | Community delivery reviews; platform rating on profile |
| Notifications | `tracked: true` | `delivery/notification-settings` |
| History | `tracked: true` | Order lists in dashboard/earnings |
| Statistics | `tracked: true` (partial) | Earnings, counts, rating; **onlineTime hardcoded 480** |
| Trust | `tracked: true` (partial) | `averageRating` only |
| Acceptance rate | `tracked: false` | — |
| Completion rate | `tracked: false` | — |
| Rejected deliveries | `tracked: false` | — |
| Current workload | `tracked: true` (partial) | Pending count, not capacity-aware |
| Future scheduling | `tracked: false` | `CourierScheduleService` has zero callers |
| Growth opportunities | `tracked: false` | Add seller roles exists; no courier growth analytics |

## Dual-role courier + seller

- API sets `isSeller: false` when `deliveryProfile` exists → seller local-delivery UI hidden on delivery dashboard even if `sellerRoles` present (**P1**).
- Courier can add seller roles via settings then use `/verkoper/*` separately — **not unified workspace**.

## Admin delivery gap

- `DeliveryManagement` calls `/api/admin/delivery/[id]/status` — **route does not exist** (**P1**).

## Can a courier run a business?

**Verdict: Partially.** Platform delivery and community requests are operable. Running a **combined courier + seller business** requires switching between `/delivery/*` and `/verkoper/*` with no unified analytics or earnings view.

---

# PART 5 — Analytics Dashboards

## By role

| Role | Surface | KPIs present | KPIs missing / `tracked: false` |
|------|---------|--------------|--------------------------------|
| **Seller** | `/verkoper/analytics` | Revenue, orders, customers, rating, views*, conversion* | Favorites, messages, popular listings, profile_visits, regional, campaign, accepted-value insights, export on analytics page |
| **Seller** | `/verkoper/dashboard` | Revenue, orders, fee, net, top products, DNA | Discovery, trust, worst listings |
| **Affiliate** | `/affiliate/dashboard` | Commission buckets, referrals, downline, payouts | Clicks, conversion, LTV, campaigns, time-series |
| **Courier** | `/delivery/dashboard` | Earnings, deliveries, rating, pending | Acceptance/completion, trends, schedule |
| **Admin** | Command center (13A) | Platform health, money, marketplace, affiliate liability | Delivery ops, webhook history, escrow aggregate, discovery usage |
| **Admin** | Legacy analytics | Broad aggregates | **10% hardcoded platform fee** — not financial SSOT |
| **Business** | Tier gates | `analytics-tier.ts` + DNA SSOT | Many declared metrics not implemented |

\* Gated by `canAccessAnalyticsMetric` (pro+ for conversion/views on analytics page).

## Analytics tier honesty gap (**P1**)

`lib/business/analytics-tier.ts` lists `favorites`, `messages`, `popular_listings` in `IMPLEMENTED_ANALYTICS_METRICS`, but `app/api/seller/dashboard/stats/route.ts` returns only `totalViews` and `conversionRate` — not favorites or messages counts.

---

# PART 6 — Cross Dashboard Consistency

| Check | Consistent? | Notes |
|-------|-------------|-------|
| Business DNA / fee % | **Mostly yes** | Seller stats/earnings/checkout/webhook use `getBusinessVisibilityProfile()` |
| Subscription plan labels | **Mostly yes** | DNA widget, badges, command center |
| Affiliate commission numbers | **Yes** | Ledger + `affiliate-config.ts` |
| Admin financial vs command center | **Partial** | Command center uses transaction sums; financial route uses transaction fee BPS — different paths |
| Trust / badges on seller vs marketplace | **No** | Tiles use `fetch-seller-trust-snapshots`; seller dashboard uses review average only |
| Delivery earnings gross vs net | **No** | Dashboard uses gross `deliveryFee`; earnings API applies `DELIVERY_DELIVERER_PERCENT` |
| Legacy admin analytics fees | **No** | 10% hardcode in `admin/analytics/route.ts` |
| Public seller stats vs dashboard | **No** | Public API uses placeholder rating 4.5 in places; different order filters |
| Terminology | **Partial** | Mixed Dutch/English; "products" vs "listings" |

**Duplicate calculation hotspots (do not add more):**

1. Seller revenue — `stats`, `earnings`, `combined`, `products`, `export`
2. Admin analytics platform fee — 10% default
3. Delivery availability — three schemas (`DeliveryProfile`, `DeliveryAvailability`, `CourierAvailability`)

---

# PART 7 — Operational Readiness

| Question | Answer |
|----------|--------|
| Can a **seller** run their business? | **Yes for core loop** (list, sell, fulfill, get paid). **No for growth optimization** without founder/DB digging. |
| Can an **affiliate** grow HomeCheff? | **No independently** — missing funnel metrics and attribution edge-case reliability. |
| Can a **courier** operate independently? | **Yes for delivery tasks**. **No as full business operator** without verkoper routes. |
| Can **admin** monitor everything? | **Improved with 13A command center**; delivery ops and several signals still `tracked: false`. |
| Can **founder** manage company from dashboards alone? | **Partially** — money and platform health visible; attribution disputes, delivery ops, and seller growth gaps need intervention. |

---

# Findings register (P0–P3)

## P0 — Blocks autonomous pilot / revenue integrity

| ID | Finding |
|----|---------|
| P0-1 | Affiliate cookie policy inconsistent (server first-touch vs client overwrite) |
| P0-2 | Business signup via ref link does not connect subscription commissions without promo metadata |
| P0-3 | `androidBeta` cookie may set `hc_beta_src` with undefined `expires` when `hc_ref` exists |
| P0-4 | No cross-device attribution — desktop click lost on mobile signup |
| P0-5 | Seller analytics tier claims implemented metrics (favorites/messages) not in API — misleading paid tiers |

## P1 — Major ops friction; founder still needed

| ID | Finding |
|----|---------|
| P1-1 | Affiliate dashboard lacks clicks, conversion, attributed orders — cannot self-optimize |
| P1-2 | Seller discovery/visibility/trust not on dashboard — cannot fix liquidity gaps |
| P1-3 | Dual-role courier+seller split across two dashboards |
| P1-4 | Admin legacy analytics uses 10% fee hardcode |
| P1-5 | Admin delivery management API missing |
| P1-6 | Command center has no delivery/courier section |
| P1-7 | Revenue math duplicated across 4+ seller endpoints (drift risk) |
| P1-8 | Social/Google signup attribution deferred to onboarding within cookie TTL only |

## P2 — Quality / scale / support load

| ID | Finding |
|----|---------|
| P2-1 | No worst-listings / zero-view seller alerts |
| P2-2 | No affiliate campaign/link variants |
| P2-3 | Delivery acceptance/completion rates not tracked |
| P2-4 | `CourierAvailability` / `CourierScheduleService` implemented but unused |
| P2-5 | Online time hardcoded in delivery dashboard API |
| P2-6 | Public seller stats diverge from authenticated dashboard |

## P3 — Polish / future growth

| ID | Finding |
|----|---------|
| P3-1 | Affiliate leaderboard / gamification |
| P3-2 | Marketing materials beyond QR |
| P3-3 | Hardcoded Dutch in legacy admin/seller components |
| P3-4 | Orphan seller components (`FeeCalculator`, `SellerEarningsDashboard`) |

---

# Executive verdict (detailed)

### Seller Dashboard — **Partially ready (6/10)**

Core commerce loop is solid: orders, revenue, fees from DNA SSOT, payouts, Stripe, action center. Missing discovery, social proof metrics, listing health, and honest analytics tier labeling. A seller can **operate** but cannot **grow strategically** from the dashboard alone.

### Affiliate Dashboard — **Not ready for independent growth (4/10)**

Commission accounting works; sharing tools (QR, copy, partial social) exist. Without click→signup→order funnel and reliable attribution contract, affiliates cannot prove ROI or optimize campaigns. Founder must handle disputes and explain "missing" commissions.

### Delivery Dashboard — **Operationally adequate, not business-complete (5/10)**

Couriers can go online, accept jobs, earn, and get paid. No performance analytics, no unified seller+courier workspace, admin cannot toggle delivery profiles via missing API.

### Analytics — **Fragmented and partially misleading (4/10)**

Each role has snapshots; none provide decision-grade KPIs with consistent `tracked` discipline except admin command center (13A). Seller tier gates overpromise implemented metrics.

### Overall Operations Readiness — **Pilot-capable, not autonomous**

HomeCheff can start a **Vlaardingen-style pilot** with founder oversight for seller onboarding, affiliate disputes, and liquidity debugging. **Largely autonomous operation is not yet achievable** until P0 attribution and analytics honesty fixes land, plus P1 affiliate funnel and seller discovery surfaces.

---

## Recommended next phases (audit-only; no implementation in 13B)

1. **13B-1** — Attribution contract unification + business subscription wiring (P0).
2. **13B-2** — Seller analytics honesty: implement or mark `tracked: false` per metric in API + UI (P0/P1).
3. **13B-3** — Affiliate funnel events (click log on referral API) (P1).
4. **13B-4** — Delivery ops in admin command center + fix admin delivery API (P1).
5. **13B-5** — Seller listing health panel (worst performers) (P2).
