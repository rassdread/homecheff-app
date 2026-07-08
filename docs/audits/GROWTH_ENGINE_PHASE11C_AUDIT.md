# Growth Engine & Business Model — Phase 11C Audit

**Date:** 2026-07-08  
**Method:** Strategic audit of HomeCheff as a real business — acquisition, activation, retention, liquidity, revenue, growth loops, community, analytics, and pilot KPIs. Architecture frozen (Phases 7A–11B). No redesign.  
**Scenario:** 100 people from Vlaardingen join tomorrow.

---

## Executive summary

HomeCheff is **technically and financially ready** for a first-city pilot. The **growth engine is built but unevenly instrumented**: strong product-led discovery, affiliate infrastructure, and retention hooks (HCP, notifications, messages) exist; **pilot-specific acquisition** (Vlaardingen story, referral welcome, municipality co-branding) and **full funnel measurement** need ops focus, not new architecture.

| Engine | Verdict | Pilot readiness |
|--------|---------|-----------------|
| Acquisition | ⚠️ Mostly | SEO + affiliate strong; pilot geo story weak (improved 11C) |
| Activation | ✅ Ready | Onboarding, pending intents, create flows wired |
| Retention | ✅ Ready | Notifications, favorites, follow, HCP, messages |
| Marketplace liquidity | ⚠️ Cold-start | Empty states good; needs seed supply + ambassadors |
| Revenue model | ✅ Ready | Commission + subscriptions + affiliate (11B) |
| Growth loops | ⚠️ Partial | Share/affiliate work; silent referral links |
| Community | ✅ Ready | Follow, reviews, reputation; connections deferred |
| Analytics | ⚠️ Improved | GA4 wired behind consent (11C); DB funnels partial |
| Measurement | ⚠️ Ops | Admin dashboards exist; pilot KPIs need manual tracking |

**Quick wins applied in 11C:**
1. Vlaardingen added to `LOCAL_SEO_CITIES` → `/maaltijden/vlaardingen`
2. Removed broken `/growth` from sitemap (404)
3. GA4 client mounted in `ConsentAwareAnalytics` when consent + `NEXT_PUBLIC_GA_MEASUREMENT_ID`

---

## Severity legend

| Level | Meaning |
|-------|---------|
| **P0** | Blocks pilot success |
| **P1** | Important before scaling |
| **P2** | Improve after pilot |
| **P3** | Long-term optimisation |

---

## 1. Acquisition

### Implemented

| Surface | Path | Role |
|---------|------|------|
| Homepage hero | `HomeHeroSection.tsx` | Dorpsplein + value exchange USP |
| SEO hub | `/seo-hub`, 20 NL/EN landings | Organic entry |
| City pages | `/maaltijden/[stad]` | 16 cities incl. **Vlaardingen** (11C) |
| Affiliate landing | `/affiliate` | Ambassador signup + QR |
| Referral links | `/welkom/[code]`, `/uitnodiging/[code]`, `/r/[slug]` | Cookie attribution |
| Social share | `ShareButton.tsx` | WhatsApp, email, etc. + `?ref=` |
| Werken bij | `/werken-bij` | Seller, courier, affiliate entry |
| In-feed promos | `home-promotions.ts` | Beta, affiliate, jobs |
| Investor pilot story | `/pitch` | Vlaardingen municipality mention |

### Gaps

| ID | Severity | Finding |
|----|----------|---------|
| ACQ1 | P1 | No dedicated public pilot landing (`/pilot`, `/vlaardingen`) with gemeente co-branding |
| ACQ2 | P1 | Referral links are **silent** — cookie set, redirect home, no welcome screen |
| ACQ3 | P2 | SEO still food-skewed on long-tail pages (9A) |
| ACQ4 | P2 | No pilot-specific ambassador share copy pack |
| ACQ5 | P3 | Municipality B2G landing documented as future |

**Pilot acquisition strategy (no code required):** QR codes → `/welkom/{code}` or `/maaltijden/vlaardingen`; WhatsApp groups; local business ambassadors; gemeente newsletter link.

---

## 2. Activation

### Funnel map

```
First visit → browse feed (guest)
  → register (email / Google)
  → [social] onboarding: profile → interests → contact → payments → buyer|seller
  → [email] home directly (split path)
  → first listing / first request / first message / first favorite
  → first proposal / first checkout / first order
```

### Time-to-value surfaces

| Milestone | Path | Instrumented |
|-----------|------|--------------|
| First browse | GeoFeed | Partial (views DB) |
| Register | `/register`, Google | GA `sign_up` (if GA ID set) |
| Onboarding steps | `/onboarding/*` | ✅ `AnalyticsEvent` |
| First listing | `/sell/new` | DB `Product.createdAt` |
| First message | `StartChatButton` | HCP + exchange funnel |
| First checkout | `/checkout` | Orders DB + exchange funnel |
| Pending intent resume | `pending-intent.ts` | `PENDING_INTENT_RESUMED` |

### Drop-off risks

| ID | Severity | Risk |
|----|----------|------|
| ACT1 | P1 | Email signup **skips** social onboarding branch — inconsistent activation |
| ACT2 | P1 | Email verification gate before chat/checkout — no funnel event |
| ACT3 | P2 | Tours opt-in only (`autoStart={false}`) — low education reach |
| ACT4 | P2 | Buyer/seller branch choice not instrumented |
| ACT5 | P3 | Dead event types never emitted (`AFFILIATE_ONBOARDING_*`, push permission) |

---

## 3. Retention

### Habit loops

| Loop | Mechanism | Status |
|------|-----------|--------|
| New listings in feed | GeoFeed + notifications | ✅ |
| Favorites | `FavoriteButton` + guest CTA | ✅ |
| Following | `FollowButton` + fan list | ✅ |
| Messages | Realtime (Pusher) + push | ✅ |
| Orders | Status updates + review prompt | ✅ |
| Deals / proposals | Chat + `CreateProposalSheet` | ✅ |
| HCP missions | `HcpActivationCard`, daily login | ✅ |
| Return belonging | `ReturnBelongingStrip`, feed state restore | ✅ |

| ID | Severity | Finding |
|----|----------|---------|
| RET1 | P2 | Push grant/deny not tracked as events |
| RET2 | P2 | Feed empty states have no impression analytics |
| RET3 | P3 | Email open/click not tracked |

---

## 4. Marketplace liquidity

### Cold-start readiness

| Question | Answer |
|----------|--------|
| Can buyers quickly find something? | **Depends on seed supply** — filters, reverse discovery, categories ready |
| Can sellers get attention? | Tiles, follow, share, HCP visibility digest |
| Empty-state quality | ✅ Sale, Gezocht, inspiration, accepted-values empties |
| Discovery diversity | 4 categories + services + wanted + inspiration |
| Reverse discovery | ✅ Direction toggle + accepted values (10D) |

| ID | Severity | Finding |
|----|----------|---------|
| LIQ1 | **P0 ops** | **Liquidity is supply-driven** — 100 users with &lt;20 listings = empty feed |
| LIQ2 | P1 | No automated “invite sellers” nudge for buyers in empty geo |
| LIQ3 | P2 | Dorpsplein/Inspiratie parallel stacks (deferred 10D) |

**Mitigation (ops, not architecture):** Pre-seed 15–30 listings across categories before launch; ambassador sellers; gemeente business outreach.

---

## 5. Revenue model

| Stream | Status | Pilot relevance |
|--------|--------|-----------------|
| Marketplace commission (12% / 7–2%) | ✅ Live | Primary pilot revenue |
| HomeCheff Checkout | ✅ Live | Trust + conversion |
| Subscriptions Basic/Pro/Premium | ✅ Live | Power sellers |
| Affiliate commissions | ✅ Accrual | Growth channel; cron ops (11B) |
| Delivery fees | ✅ Live | If platform delivery used |
| Premium boosts / promoted listings | ❌ Future | Not in codebase |
| Profile/social promotion | ❌ Future | Not in codebase |

### Dependency analysis

| Dependency | Risk |
|------------|------|
| Stripe Connect onboarding | Sellers need Connect for checkout ads |
| Transaction volume | Revenue ∝ GMV × fee% |
| Subscription uptake | Secondary; reduces fee % for subscribers |
| Affiliate program | Commission cost; needs cron for payouts |

**Revenue diversity:** Moderate — commission + subscriptions + delivery; no ads/boosts yet.

---

## 6. Growth loops

| Loop | Status | Notes |
|------|--------|-------|
| Buyer → seller | ✅ | Create CTA in empty states, UserActionCenter |
| Seller → buyer | ✅ | Share listing, affiliate ref on share |
| Follower → customer | ✅ | Follow + notifications |
| Customer → ambassador | ⚠️ | `/affiliate` exists; requires account + signup |
| Ambassador → new users | ⚠️ | Links work; silent attribution |
| Affiliate → recurring | ⚠️ | Subscription + order commissions; cron ops |
| Community → retention | ✅ | HCP, achievements, pulse bar |

---

## 7. Community

| Surface | Status |
|---------|--------|
| Following | ✅ Live |
| Reviews | ✅ Post-order |
| Local reputation | ✅ Seller profile, HCP |
| Connections (future) | Architecture-ready via follow/messages; no graph product |
| Events / challenges | ⚠️ HCP missions only; no events module |
| Neighbour trust | ✅ Settlement explanations, reviews, public profiles |

---

## 8. Analytics & measurability

### Three layers

| Layer | What | Pilot use |
|-------|------|-----------|
| **Prisma `AnalyticsEvent`** | Onboarding, activity cards, views | Internal funnel |
| **GA4** | Commerce, registration, exchange funnels | **Now wired** behind consent (11C) |
| **Operational DB** | Users, orders, favorites, HCP | Truth for KPIs |

### Funnel measurability

| Funnel | Measurable? |
|--------|-------------|
| Visitors | Vercel Analytics + GA4 (with consent) |
| Registrations | DB + GA `sign_up` |
| Activation (listing/message) | DB counts |
| Checkout / GMV | Orders + admin financial |
| Affiliate signups | Affiliate table |
| Subscriptions | SellerProfile + subscription orders |
| D7 retention | Manual from admin user metrics |
| CAC / LTV | **Not automated** — spreadsheet pilot |

| ID | Severity | Finding |
|----|----------|---------|
| ANA1 | P1 | CAC/LTV not computed — manual pilot tracking |
| ANA2 | P2 | `lib/analytics-events.ts` registry unused |
| ANA3 | P2 | No onboarding funnel dashboard in admin UI |

---

## 9. Recommended pilot KPIs

### 30 days (launch)

| KPI | Target (indicative) | Source |
|-----|---------------------|--------|
| Registered users | 100 | `User` count |
| Activated sellers (≥1 listing) | 25 | `Product` by seller |
| Active listings (published) | 40+ | Product visibility |
| Weekly active users | 40% of registered | Session / last login |
| First messages | 30+ | Conversation count |
| Completed orders | 10+ | `Order` CONFIRMED+ |
| GMV | Track baseline | Admin financial |
| Referral attributions | Track | `Attribution` table |

### 60 days

| KPI | Focus |
|-----|-------|
| D30 retention | % users with 2nd visit |
| Repeat buyers | ≥2 orders |
| Proposal → deal conversion | CommunityOrder linked |
| Affiliate signups | Active affiliates |
| Subscription conversions | Business sellers on plan |
| Empty-feed rate | Manual geo check |

### 90 days

| KPI | Focus |
|-----|-------|
| Monthly GMV growth | Week-over-week |
| Seller retention | Active listings per seller |
| Neighbour help / services share | Category mix |
| HCP engagement | Streaks, mission completion |
| Word-of-mouth | Referral cookie → signup rate |
| Unit economics | Commission revenue vs affiliate cost |

---

## 10. Risks

| Category | Risk | Severity |
|----------|------|----------|
| **Liquidity** | Too few listings → empty feed churn | P0 ops |
| **Growth** | Silent referral links → low conversion | P1 |
| **Revenue** | Low Connect adoption blocks checkout | P1 |
| **Operations** | Affiliate payout crons not scheduled | P1 ops (11B) |
| **Trust** | First bad transaction without support response | P1 ops |
| **Measurement** | Consent-gated GA understates funnel | P2 |
| **Business** | Over-reliance on food SEO vs full platform | P2 |
| **Scale** | Webhook volume at 5k+ users | P3 |

### Single points of failure

1. Stripe webhook delivery → order creation
2. Seed supply for liquidity
3. Founder/ops response to first disputes
4. `CRON_SECRET` affiliate jobs (if program active)

---

## 11. Quick wins (11C + recommended post-launch)

### Applied in 11C (code)

| Win | Impact |
|-----|--------|
| Vlaardingen in `LOCAL_SEO_CITIES` | Local SEO entry `/maaltijden/vlaardingen` |
| Remove `/growth` sitemap 404 | Crawler hygiene |
| GA4 behind consent | Exchange + registration funnels measurable |

### Recommended post-launch (minimal, existing architecture)

| Win | Effort | Impact |
|-----|--------|--------|
| Schedule affiliate payout crons | Ops | Commission payouts |
| Pre-seed 20+ listings in Vlaardingen | Ops | Liquidity |
| Ambassador QR pack (link + copy) | Marketing | Acquisition |
| Referral welcome banner (i18n + existing layout) | Small code | ACQ2 |
| Track feed empty-state impression | Small code | LIQ2 visibility |
| Email verify funnel event | Small code | ACT2 |

**Not recommended pre-pilot:** New boost system, connection graph, municipality portal, redesign.

---

## Findings summary

| ID | Severity | Finding | Status |
|----|----------|---------|--------|
| LIQ1 | P0 ops | Liquidity requires seeded supply | Ops plan |
| ACQ1 | P1 | No public pilot landing | Document / marketing |
| ACQ2 | P1 | Silent referral welcome | Post-launch quick win |
| ACT1 | P1 | Split email vs social onboarding | Monitor |
| AFF1 | P1 ops | Affiliate crons (11B) | Schedule |
| ANA1 | P1 | Manual CAC/LTV for pilot | Spreadsheet |
| ACQ3–5 | P2/P3 | SEO skew, share kit, B2G | Deferred |

**No P0 code blockers** — P0 is operational (seed supply).

---

## Business verdict — six questions

### 1. Is HomeCheff technically ready?

**Yes.** RC1 approved (11A). Marketplace, discovery, settlement, messaging, notifications, HCP, affiliate infra, and growth surface contract are implemented and validated.

### 2. Is HomeCheff financially ready?

**Yes.** Follow the Money audit (11B): checkout, payouts, subscriptions, affiliate accrual verified. Ops: Stripe secrets, Connect E2E test, affiliate crons if program active.

### 3. Is HomeCheff operationally ready?

**Conditional Yes.** Requires: seed listings, support playbook for first orders, affiliate cron schedule, gemeente launch coordination. Not a software gap.

### 4. Is HomeCheff commercially ready?

**Yes for pilot.** Revenue model works (commission + subscriptions + affiliate). No boosts yet — acceptable for city pilot. Unit economics tracked manually first 90 days.

### 5. Is HomeCheff ready for the first city pilot?

**Yes** — launch Vlaardingen with ops plan for liquidity and acquisition. Software does not block; **success depends on supply seeding and local activation**, not new features.

### 6. Top 10 actions after launch

1. **Seed 20–30 listings** across food, garden, creations, services in Vlaardingen radius.
2. **Activate 5–10 ambassadors** with QR links to `/welkom/{code}`.
3. **Schedule affiliate payout crons** (`update-status` daily, `process` weekly).
4. **Track weekly KPI sheet** — registrations, listings, messages, orders, GMV.
5. **Monitor empty-feed rate** in Vlaardingen geo; recruit sellers if high.
6. **Respond to first 10 transactions** personally — trust building.
7. **Verify GA4 + admin financial** dashboards weekly.
8. **Prompt Connect onboarding** for sellers with checkout-enabled listings.
9. **Collect qualitative feedback** — where did you drop off?
10. **Day-30 review** — double down on best category; adjust ambassador incentives.

---

## Validation

```bash
npx tsx scripts/validate-growth-engine-phase11c.ts
npm run lint
npm run build
```
