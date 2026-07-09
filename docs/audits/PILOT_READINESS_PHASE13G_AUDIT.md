# Phase 13G Audit — Pilot Readiness & Operational Excellence

**Date:** 2026-07-09  
**Scope:** Definitive pre-pilot assessment for Vlaardingen / Schiedam / Rotterdam launch.  
**Rules:** No architecture redesign. No duplicate SSOT. No fake metrics. Respects Phases 1–13F.

---

## Founder verdict

### **🟡 Ready with acceptable risks**

**If Sergio launches the HomeCheff pilot tomorrow in Vlaardingen, Schiedam and Rotterdam, the platform is ready for a founder-supervised local pilot** — not for unattended scale.

| Criterion | Assessment |
|-----------|------------|
| Can strangers register, discover local listings, buy, sell, chat, and complete orders? | **Yes** — when Stripe is configured |
| Can Sergio operate day-to-day without code deploy for incidents? | **Mostly** — ~85% admin autonomy (13F); Stripe/Vercel edge cases remain |
| Are there hidden stubs that break trust if linked? | **Yes** — `/reservations`, `/place` — must stay unlinked |
| Is telemetry complete enough to optimize the pilot? | **No** — many funnel steps honestly `not tracked`; GA4 consent-gated |
| Is security/production posture acceptable for 100–500 users? | **Yes with P1** — permission guards incomplete on legacy admin APIs |

**Concrete blockers avoided (prior phases):** settlement router SSOT, attribution contract (13C), admin suspend/delivery/subscription APIs (13E), Founder Control Center IA (13F).

**Why not ✅ Ready to launch:** mock delivery availability fees in checkout UI path, incomplete pilot funnel telemetry, unwired admin permission matrix on ~45 API routes.

**Why not 🟠 / 🔴:** Phase 10A + 11A RC already validated core journeys; 13E closed founder P0 ops gaps; commerce path is real Stripe, not prototype.

---

# PART 1 — Complete product audit

| Module | Complete? | Missing / confusing | Production ready? | Pilot ready? |
|--------|-----------|---------------------|-------------------|--------------|
| **Homepage** | ✅ | Dense GeoFeed; learning curve | ✅ | ✅ |
| **Geo Feed** | ✅ | Client-side filter on large sets at scale | ✅ | ✅ |
| **Marketplace** | ✅ | No `/marketplace` route — by design (`/` + detail) | ✅ | ✅ |
| **Requests (Gezocht)** | ✅ | — | ✅ | ✅ |
| **Inspiration** | ✅ | Chip on `/`; legacy `/inspiratie` redirects | ✅ | ✅ |
| **Products** | ✅ | — | ✅ | ✅ |
| **Services** | ✅ | Category axis, not separate route | ✅ | ✅ |
| **Exchange / Barter** | ✅ | Mobile sticky CTA checkout-biased for `MONEY_AND_BARTER` | ✅ | ⚠️ test ruil path |
| **Checkout** | ✅ | Mock fallback if Stripe unset; mock `/api/payment/create` exists | ✅ if env OK | ✅ |
| **Orders** | ✅ | Deals live in `/profile/deals` not `/orders` | ✅ | ✅ |
| **Chat** | ✅ | E2E encrypted — admin sees metadata only | ✅ | ✅ |
| **Notifications** | ✅ | Push requires FCM token | ✅ | ✅ |
| **Reviews** | ✅ | Verified purchase path | ✅ | ✅ |
| **Profiles** | ✅ | Profile vs Operations split intentional | ✅ | ✅ |
| **Business DNA** | ✅ | SSOT `visibility-profile.ts`; score is config-derived | ✅ | ✅ |
| **Business subscriptions** | ✅ | `/sell` + Stripe Billing; cancel API | ✅ | ✅ |
| **Affiliate** | ✅ | Funnel metrics not tracked (honest) | ✅ | ⚠️ measure manually |
| **Delivery** | ⚠️ | Availability check uses mock distance/fees | ⚠️ | ⚠️ verify fees E2E |
| **Growth / HCP** | ✅ | Carousel admin; no HCP cash prizes | ✅ | ✅ |
| **Studio** | ⚠️ | SEO `gemeenschap/studio` — not separate app module | ✅ | ✅ |
| **Admin / FCC** | ✅ | Entity hub not built (13F deferred) | ✅ | ✅ |
| **Mobile (Android)** | ✅ | Capacitor, native push, APK update | ✅ | ✅ |
| **Desktop** | ✅ | Wide FCC layout (13F) | ✅ | ✅ |
| **Tablet** | ✅ | Responsive ops shell | ✅ | ✅ |
| **Reservations** | ❌ | `app/reservations/page.tsx` — mock data | ❌ | ❌ hide |
| **Place** | ❌ | `app/place/page.tsx` — no API persistence | ❌ | ❌ hide |

---

# PART 2 — User journey audit

## Buyer

| Step | Status | Evidence |
|------|--------|----------|
| Guest browse feed | ✅ | `/`, `/api/feed` |
| Register | ✅ | `/register`, `/api/auth/register` |
| Verify email | ✅ | `/verify-email` |
| Favorite / message | ✅ | Auth gates |
| Add to cart / checkout | ✅ | `settlement-router.ts` → checkout |
| Pay (Stripe) | ✅ | `/api/checkout` → webhook |
| Track order | ✅ | `/orders/[orderId]` |
| Review | ✅ | `/api/products/[id]/reviews` |
| Report issue | ✅ | `/api/reports/create` |

## Seller

| Step | Status | Gap |
|------|--------|-----|
| Create profile / seller | ✅ | KVK path for business |
| Post first listing | ✅ | `/sell/new` |
| Receive message | ✅ | Chat + proposals |
| Receive order | ✅ | `/verkoper/orders` |
| Stripe Connect onboard | ✅ | Action center CTA |
| Complete order | ✅ | Status updates |
| Receive review | ✅ | — |
| Become business (KVK) | ✅ | Seller profile fields |
| Upgrade subscription | ✅ | `/sell` |
| Payout | ✅ | `/verkoper/revenue` |

## Business (KVK + subscription)

| Step | Status | Gap |
|------|--------|-----|
| Subscribe BASIC/PRO/PREMIUM | ✅ | `/api/subscribe` |
| DNA benefits applied | ✅ | `getBusinessVisibilityProfile()` |
| Lower platform fee at checkout | ✅ | `resolvePlatformFeePercent()` |
| Cancel at period end | ✅ | `/api/subscribe/cancel` |
| Admin inspect lifecycle | ✅ | 13E `business-subscriptions` API |
| See billing health on dashboard | ⚠️ | No `past_due` card on verkoper |

## Affiliate

| Step | Status | Gap |
|------|--------|-----|
| Signup / referral link | ✅ | `/affiliate`, `/api/affiliate/referral` |
| Attribution cookie | ✅ | 13C contract |
| Dashboard commissions | ✅ | `/affiliate/dashboard` |
| Promo codes | ✅ | `/affiliate/promo-codes` |
| Stripe Connect payout | ✅ | — |
| Subscription attribution | ✅ | 13C `resolveSubscriptionAttributionId` |
| Funnel analytics | ❌ | Clicks/conversion `not tracked` |

## Courier

| Step | Status | Gap |
|------|--------|-----|
| Create delivery profile | ✅ | Onboarding |
| Go online / GPS | ✅ | `DeliveryDashboard.tsx` |
| Accept / complete delivery | ✅ | — |
| Earnings | ✅ | `/api/delivery/earnings` |
| Admin approve/block | ✅ | 13E delivery APIs |

## Admin / Founder

| Step | Status | Gap |
|------|--------|-----|
| Command Center health | ✅ | `/api/admin/command-center` |
| Suspend user | ✅ | 13E |
| Refund / escrow | ✅ | Financial + orders admin |
| Trust queue | ✅ | 13E |
| Broadcast notification | ✅ | Growth domain |
| Single-screen user ops | ⚠️ | Entity hub deferred |

## Barter / proposal journey

| Step | Status |
|------|--------|
| Listing with barter openness | ✅ |
| Chat → proposal | ✅ |
| Accept → community order | ✅ |
| Deal checkout (if money leg) | ✅ |
| Agreements hub | ✅ `/profile/deals` |

---

# PART 3 — UX polish audit

| Area | Finding | Priority |
|------|---------|----------|
| **Buttons** | Emerald primary consistent; some legacy gray admin tables | P2 |
| **Duplicated actions** | Checkout sticky vs detail CTAs on mobile barter | P1 |
| **Unnecessary clicks** | FCC improved (13F); affiliate 7 sub-tabs dense | P2 |
| **Wording** | NL primary; EN via i18n — orders fixed 10A | ✅ |
| **Empty states** | Feed empty states exist; reverse-discovery empty not tracked | P2 |
| **Loading** | SWR stale-while-revalidate on feed; skeletons in ops | ✅ |
| **Success screens** | `/payment/success` polls order | ✅ |
| **Errors** | Checkout blocks `BARTER_ONLY`, suspended users | ✅ |
| **Icons** | Lucide consistent in FCC | ✅ |
| **Spacing / typography** | Design system phases 6A/6B; GeoFeed dense | P2 |
| **Responsiveness** | Mobile feed toolbar, FCC collapsible nav | ✅ |
| **Accessibility** | Filter sheet focus — 10A P2 item | P2 |
| **Hover** | Desktop sidebar marketplace nav | ✅ |

**UX pilot verdict:** Feels like a real product for core flows; power-user surfaces (affiliate admin, GeoFeed density) still feel “built over time.”

---

# PART 4 — Dashboard completeness

Framework: **What happened? Why? Attention? Action?**

| Dashboard | What | Why | Attention | Action | External tool needed? |
|-----------|------|-----|-----------|--------|-------------------------|
| **Seller (verkoper)** | ✅ stats, orders | ⚠️ payout blockers in revenue | ✅ SellerActionCenter | ✅ deep links | Stripe for Connect detail |
| **Business DNA widget** | ✅ plan, fees | ✅ SSOT benefits | ⚠️ upgrade only | ✅ `/sell` | — |
| **Affiliate** | ✅ commissions | ⚠️ no funnel why | ⚠️ header Stripe CTA | ✅ payout, promos | Stripe payouts |
| **Delivery** | ✅ earnings, orders | ❌ | ⚠️ inline banners | ✅ accept/online | — |
| **Operations Today** | ✅ role cards | ⚠️ | ✅ attention chips | ✅ quick grid | — |
| **Founder Control Center** | ✅ | ⚠️ notes on gaps | ✅ attentionNow | ⚠️ links | Stripe/Vercel edge |
| **Admin Financial** | ✅ | ✅ | ⚠️ alerts component | ✅ refund/release | Stripe for disputes |
| **Seller Analytics** | ⚠️ | tier gates vs data | — | — | — |

**Still requires DB/code for:** Business DNA fee tier changes, delivery pricing, SEO pages, affiliate config rates, discovery ranking weights.

---

# PART 5 — Operational readiness

| Domain | From admin? | External tool | Classification |
|--------|-------------|---------------|----------------|
| Users | ✅ CRUD, suspend | — | In-app |
| Businesses | ⚠️ subscription API | Stripe Billing | Optional Stripe |
| Orders | ✅ | — | In-app |
| Payments | ✅ read + refund | Stripe disputes/chargebacks | **Required by design** |
| Refunds | ✅ | Stripe execution | In-app trigger |
| Subscriptions | ✅ 13E lifecycle API | Stripe portal for card update | Optional Stripe |
| Affiliate | ✅ status, promos | Payout bank verification | Optional Stripe |
| Delivery | ✅ 13E status/block | — | In-app |
| Trust & Safety | ✅ queue, moderation | — | In-app |
| Notifications | ✅ broadcast | FCM console rare | In-app |
| Reports | ✅ | — | In-app |
| Escrow release | ✅ admin API | — | In-app |
| Disputes | ✅ | — | In-app |
| Audit logging | ⚠️ partial | — | Should expand P1 |
| Permissions | ⚠️ UI yes, API sparse | — | **Should move P1** |
| Deploy / migrations | ❌ | Vercel, Prisma CLI | **Required by design** |
| Fee/DNA/SEO config | ❌ | Code deploy | **Should move P1** (post-pilot) |

**Founder can run pilot from app** for daily incidents. **Cannot** change platform economics or deploy without engineering.

---

# PART 6 — Performance audit

| Area | Status | Note |
|------|--------|------|
| Feed loading | ✅ Good | `home-feed-return-cache.ts`, single `/api/feed` |
| Search | ✅ | In-feed + geo |
| Filters | ⚠️ | Client-side at scale — monitor 1k+ listings |
| Images | ✅ | `useMobileOptimization` quality tiers |
| Chat | ✅ | `route-fast` 30s cache |
| Notifications | ✅ | Session SWR |
| Dashboard loading | ⚠️ | Command Center ~35 parallel queries |
| Mobile | ✅ | Lazy chunks, Capacitor |
| DB queries | ⚠️ | Heavy feed joins |
| API duplication | ⚠️ | `/api/products` vs `/api/feed` on Dorpsplein |
| Caching | ✅ | SWR + feed return cache |
| Bundle | ✅ | `next.config.mjs` splitChunks |

**Meaningful P1 improvement:** Persist webhook failure rows (ops + perf debugging).  
**P2:** Shared cache for serverless chat-fast (not cross-instance today).

---

# PART 7 — Pilot telemetry

## Funnel steps

| Step | Tracked? | Mechanism |
|------|----------|-----------|
| Visitor | ⚠️ | GA4 if consent |
| Registration | ⚠️ | GA4 `sign_up`; no admin aggregate |
| Profile completed | ⚠️ | Onboarding analytics POST |
| First listing | ⚠️ | No dedicated admin metric |
| First message | ❌ | `notTracked` in command-center |
| First order | ✅ | Orders count |
| First payment | ✅ | GMV / orders |
| First review | ✅ | Reviews count |
| Second order | ⚠️ | No repeat-buyer funnel |
| Business upgrade | ⚠️ | MRR estimate; upgrades `notTracked` |
| Affiliate signup | ✅ | Affiliate counts |
| Courier signup | ✅ | Delivery profile count |

**Honesty:** Command Center uses `tracked: false` — **no fake telemetry**.

**Dual trackEvent SSOT:** `lib/analytics-events.ts` vs `GoogleAnalytics.tsx` — consolidation P2.

**Exchange funnel:** `exchange-funnel-analytics.ts` — strong for barter pilot subset.

---

# PART 8 — Founder pilot dashboard

| KPI | Visible in FCC? | Source |
|-----|-----------------|--------|
| New users | ✅ | command-center overview |
| Active users | ✅ | 7-day activity |
| New businesses | ⚠️ | KVK sellers inferred |
| Active sellers | ✅ | listings + sellers |
| Active couriers | ✅ | delivery profiles |
| Orders | ✅ | — |
| Revenue / GMV | ✅ | money section |
| Platform commission | ✅ | fee estimates |
| Affiliate commission | ✅ | affiliate section |
| Stripe onboarding completion | ✅ | pending Connect count |
| Subscription upgrades | ❌ | `notTracked` |
| Top categories | ⚠️ | partial |
| Low/high supply regions | ⚠️ | Vlaardingen slice; not full Rijnmond heatmap |
| Pending disputes | ✅ | trust section |
| Delivery performance | ⚠️ | partial |
| Trust health | ✅ | reports + queue |

**Critical missing for pilot optimization:** activation funnel, empty-feed rate, acquisition source on registration, attributed affiliate orders aggregate.

---

# PART 9 — Stress readiness

| Scale | Ready? | Risk |
|-------|--------|------|
| 100 users | ✅ | — |
| 500 users | ✅ | Monitor feed |
| 1,000 users | ⚠️ | GeoFeed client filter; feed API joins |
| 10,000 listings | ⚠️ | Pagination exists; discovery ranking load |
| 100 couriers | ✅ | |
| 100 affiliates | ✅ | |
| Thousands of chats | ⚠️ | Pusher costs; chat-fast cache per-instance |
| Hundreds concurrent orders | ✅ | Stripe + webhook idempotency |

**Rijnmond pilot (est. 100–500 users first 90 days):** architecture sufficient.

---

# PART 10 — Production readiness checklist

## P0 — Launch blockers

| ID | Finding | Status |
|----|---------|--------|
| P0-1 | Stripe not configured → mock checkout | **Mitigate** — verify env before launch |
| P0-2 | Prisma migration not deployed (13E suspend fields) | **Mitigate** — `migrate deploy` |
| P0-3 | Public links to `/reservations` or `/place` | **Mitigate** — do not link |

*No open P0 code defects block launch if env + nav hygiene enforced.*

## P1 — Fix before or during pilot

| ID | Finding |
|----|---------|
| P1-1 | `check-availability` mock distance/fees (`app/api/delivery/check-availability/route.ts`) |
| P1-2 | Admin API permission guards on legacy routes (~45 without `admin-guard`) |
| P1-3 | Mobile barter CTA asymmetry (`MONEY_AND_BARTER` listings) |
| P1-4 | Activation / empty-feed telemetry for pilot learning |
| P1-5 | Seller `past_due` / subscription health visibility |
| P1-6 | Confirm production webhook + idempotency |

## P2 — After pilot starts

| ID | Finding |
|----|---------|
| P2-1 | Entity admin hub `/admin/users/[id]` |
| P2-2 | Global admin search / ⌘K |
| P2-3 | Consolidate analytics tabs + trackEvent SSOT |
| P2-4 | Wire `EditUserModal` |
| P2-5 | Affiliate commission adjustment UI |
| P2-6 | `/reservations` and `/place` implement or remove |

## P3 — Future scale

| ID | Finding |
|----|---------|
| P3-1 | Admin-editable Business DNA / fees / SEO |
| P3-2 | Exchange push notifications |
| P3-3 | Multi-hop exchange graph |
| P3-4 | Feed server-side filter registry |

---

# PART 11 — Success scores

| Domain | Score | Justification |
|--------|-------|---------------|
| **Marketplace** | 8.5 | Unified discovery, settlement SSOT, barter path; mobile CTA friction |
| **Business DNA** | 8.0 | Strong SSOT; config-not-performance score; not admin-editable |
| **Business Dashboard** | 7.0 | DNA widget good; billing health invisible |
| **Seller Experience** | 8.0 | Operate-ready; grow/discovery diagnostics weak |
| **Buyer Experience** | 8.5 | Complete checkout journey; delivery fee display trust gap |
| **Delivery** | 7.0 | Operate OK; mock availability; no performance trends |
| **Affiliate** | 7.5 | Payout path solid; funnel telemetry missing |
| **Orders** | 8.5 | Buyer + seller + escrow; deals separate hub |
| **Payments** | 8.0 | Real Stripe; mock legacy endpoints must stay unused |
| **Notifications** | 8.0 | Multi-channel; consent/push variance |
| **Trust & Safety** | 8.5 | 13E queue + suspend + moderation |
| **Admin** | 8.0 | FCC + P0 APIs; permission granularity gap |
| **Founder Control Center** | 8.4 | Per 13F; honest metrics |
| **UX** | 7.5 | Commercial feel on core paths; density on power surfaces |
| **Performance** | 8.0 | Pilot-scale good; feed/command-center heavy |
| **Mobile** | 8.0 | Android mature; iOS thinner |
| **Overall Pilot Readiness** | **8.0** | **🟡 Launch with acceptable risks** |

---

## SSOT reference (reuse only)

| Domain | SSOT |
|--------|------|
| Settlement | `lib/marketplace/settlement/settlement-router.ts` |
| Business fees / DNA | `lib/business/visibility-profile.ts` |
| Attribution | `lib/affiliate-attribution-contract.ts` |
| Affiliate economics | `lib/affiliate-config.ts` |
| Delivery pricing | `lib/deliveryPricing.ts` |
| Admin navigation | `lib/founder-control-center/navigation.ts` |
| Admin guards | `lib/admin-guard.ts` |
| Discovery | `lib/discovery/`, `lib/feed/` |
| Order status | `lib/orders/order-status-display.ts` |

---

## Validation chain

This audit is guarded by `scripts/validate-pilot-readiness-phase13g.ts`, chaining 13F → 13E → 13D → 13C validators.

---

## Final statement

HomeCheff is **ready for a supervised Rijnmond pilot** with eyes open: configure Stripe, deploy migrations, hide stub routes, accept telemetry blind spots for month one, and prioritize P1-1 (delivery availability honesty) and P1-6 (webhook verification) in week one.

**Verdict: 🟡 Ready with acceptable risks.**
