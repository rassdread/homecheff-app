# Phase 13O — Ethical Product Philosophy & Social Impact Audit

**Date:** 2026-07-11  
**Scope:** Audit only — map founder philosophy to measurable product evidence. No redesign, no marketing claims without code backing.  
**Method:** Code review, existing audits, API/schema inspection, mechanism classification.

---

## Executive summary

HomeCheff is **not** a conventional attention-maximization platform. It has no ad feed, no autoplay video loop, no infinite unbounded scroll, and explicit **anti-manipulation guardrails** for real-world activations. Its core commerce model — local discovery, multiple settlement paths (checkout, barter, direct contact), and community orders — aligns with creating **real-world opportunity** rather than passive consumption.

However, the product **does borrow engagement mechanics** from conventional consumer apps in bounded form: UTC login streaks, leaderboards, social comparison copy, animated social buttons, ambient notification polling, and interleaved growth cards in the feed. These are **mission-adjacent** (recognition for contribution) but carry **habit-loop risk** if not continuously audited.

**Critical honesty:** Several subscription and DNA preview claims (discovery ranking boost, visibility multiplier) are **implemented in code but not wired to live feed ranking**. The €2,000/year individual revenue cap is **marketing-only** with no enforcement. GDPR data export is a **UI stub**. Suspension is enforced on checkout only, not messaging or listing creation.

**Overall:** HomeCheff is ethically **directionally aligned** with the founder's vision and already **outperforms major social platforms** on several dimensions — but it is **not yet fully consistent** between stated philosophy, monetization copy, and enforcement.

---

# Part 1 — Mission-to-product mapping

| # | Principle | Intended outcome | Existing mechanisms | Evidence | Missing evidence | Risks | Possible KPI |
|---|-----------|------------------|---------------------|----------|------------------|-------|--------------|
| 1 | Respect users' time | Complete tasks quickly; leave without friction | Phase 13N return caches, stale-while-revalidate feed, route handoff, bounded feed pool (80), task-oriented empty states | `home-feed-return-cache.ts`, `listing-detail-return-cache.ts`, `FEED_DISCOVERY_POOL_CAP` | Time-to-outcome funnels not centralized | Residual scroll + polling re-engagement | Median `ROUTE_TRANSITION_MS`; visit → order completion time |
| 2 | Local economic opportunity | Individuals can earn without subscription | 12% individual fee, Stripe Connect, sell flow, community orders, delivery earnings | `visibility-profile.ts`, `checkout/route.ts`, `delivery-payout.ts` | First-time seller revenue not tracked as impact metric | Barter/direct bypass platform fee | % sellers with ≥1 paid order; median seller net/month |
| 3 | Neighbourhood connection | Repeat local relationships | Geo radius, follow/fans, messages, requests, community orders | `GeoFeed`, `Follow`, `conversations/*`, `community/` | Repeat buyer–seller pairs not surfaced to users | Transaction-only usage | % orders within 10 km; repeat order rate |
| 4 | Reward useful participation | HCP for real actions, not passive scroll | HCP action table, deal completion, props cap (15/day), badge unlocks | `hcp-actions.ts`, `interaction-hcp.ts` | Daily login awards without transaction | Streaks reward opening app | HCP earned per completed deal vs per login |
| 5 | Avoid manipulative engagement | No FOMO, pressure, shame | `activation-safety.ts`, `activation-anti-spam.ts`, promo push default off | Blocked copy patterns, 2/session cap | Streaks, leaderboards, nearby-product probe | Mixed signals | % activations passing safety audit |
| 6 | Meaningful user control | Privacy, notifications, settlement choice | Notification prefs, quiet hours, privacy settings, settlement router | `NotificationSettings.tsx`, `settlement-router.ts` | Dead privacy fields; export stub | Illusion of control | % users changing defaults; opt-out rate |
| 7 | Transparent fair monetization | Understand fees and paid benefits | Pricing page, DNA comparison, fee on webhook | `visibility-profile.ts`, `pricing/page.tsx` | Boost not live in feed; €2k cap unenforced | Trust erosion | Support tickets on fees; plan comprehension survey |
| 8 | Protect vulnerable users | Accessible, fair for low-digital-skill users | Soft auth gates, i18n, delivery phase masking | `delivery-privacy.ts`, `nl.json`/`en.json` | Checkout hardcoded NL; `alert()` UX; a11y gaps | Exclusion | Task completion rate by locale; a11y audit score |
| 9 | Trust and accountability | Reviews, disputes, suspension, refunds | Admin disputes/refunds, Stripe escrow, trust tiers in ranking | `admin/disputes`, `ranking-profiles.ts` | Buyer self-service dispute; suspend not global | Harm from bad actors | Dispute resolution time; refund rate |
| 10 | Reduce waste / local reuse | Barter, surplus, neighbour help | Barter models, accepted values, requests, community economy | `barter-models.ts`, `community/` docs | Food waste kg not tracked | Greenwashing if claimed without data | Barter/community order count |
| 11 | Real-world outcomes | Offline meetups, deliveries, exchanges | Proposals, deals, delivery flow, activations (real-world category) | `DealCard.tsx`, activation contracts | Outcome verification | Digital-only engagement | Orders marked DELIVERED; proposals → deal rate |
| 12 | Financial sustainability | HomeCheff profitable at fair fees | Tiered subscriptions, platform fee, delivery cut, affiliate on fee share | 12/9/7/5% + €39–199/mo | Affiliate can take 50% of platform fee | Mission vs margin tension | Net revenue per order; CAC/LTV (pilot) |

---

# Part 2 — Attention and addiction audit

Classification: **Healthy** | **Neutral** | **Risky** | **Manipulative**

| Surface | Mechanism | Classification | Explanation |
|---------|-----------|----------------|-------------|
| **GeoFeed** | IntersectionObserver load-more, 480px prefetch | **Neutral** | Bounded pool (~80 items); not infinite DB scroll |
| **GeoFeed** | Stale-while-revalidate return cache | **Healthy** | Prior content stays visible; respects time |
| **GeoFeed** | Native 2-card gate then expand | **Risky** | Shapes first-screen depth; mild engagement shaping |
| **GeoFeed** | Interleaved growth/activity cards (max 2/session) | **Risky** | Capped nudging; anti-spam rules apply |
| **HCP streaks** | UTC daily login; reset to 1 if missed | **Risky** | Classic loss-aversion habit loop |
| **HCP** | Auto `recordDailyLoginIfNeeded` on `/api/gamification/me` | **Risky** | Passive credit for opening points UI |
| **HCP** | 7-day streak bonus (+25), weekly "login 7×" mission | **Risky** | Compulsive return incentive |
| **HCP** | Floating +HCP toasts (3.2s, stack 4) | **Risky** | Intermittent reinforcement UI |
| **Leaderboards** | Weekly/monthly/yearly scopes; "Jij kunt hier staan" | **Risky** | Social comparison; not manipulative if transparent |
| **Leaderboards** | Weekly spotlight top-3 | **Risky** | Status competition for visibility |
| **Notifications** | Bell poll every 45s when tab visible | **Risky** | Ambient attention cue |
| **Notifications** | Nearby new-products probe every 30 min | **Risky** | FOMO-lite ("Nieuwe producten in jouw omgeving!") |
| **Notifications** | Quiet hours + promo default off | **Healthy** | User control; respectful defaults |
| **Notifications** | HCP badge-only in-app, no push fan-out | **Healthy** | Avoids spam for every point |
| **Props/Fans** | Appreciation + daily cap 15 HCP | **Healthy** | Bounded social reward |
| **Props/Fans** | Pulse/bounce animations when active | **Risky** | Micro-reward feedback |
| **Props/Fans** | Fan → new listing notifications | **Neutral** | Expected follow behavior |
| **Onboarding** | Opt-in tours only (button click) | **Healthy** | No forced tour |
| **Onboarding** | Soft auth gates with resume intent | **Neutral** | Conversion with return path |
| **Onboarding** | `softGate.ranking` "word gezien" copy | **Risky** | Status FOMO in gate copy |
| **Activations** | `no_pressure_mechanics`, blocked shame/FOMO copy | **Healthy** | Explicit ethical guardrails |
| **Affiliate** | Referral cookies, commission tree | **Neutral** | Standard affiliate model |
| **Affiliate** | "Samen verdienen" soft gate | **Risky** | Financial persuasion in community UX |
| **Business DNA** | Upgrade prompts on sell/dashboard | **Neutral** | Commercial; not addiction |
| **Empty states** | Actionable (widen radius, switch filter) | **Healthy** | Task completion, not shame |

**Not found (positive):** autoplay video feed, variable loot-box rewards, difficult unsubscribe, forced sharing, endless unbounded scroll, ad auction feed.

---

# Part 3 — "Time well spent" audit

| Journey | Useful goal | Unnecessary steps / friction | Encourages completion? | Assessment |
|---------|-------------|------------------------------|------------------------|------------|
| Discover local offer | Find relevant listing | Viewport resolve delay on home; filter learning curve | Yes — empty states guide | **Good** with 13N improvements |
| Sell meal/product | Publish listing | Seller activation nudges; Stripe Connect setup | Yes — draft preservation | **Moderate** — payment setup heavy |
| Post request | Neighbour help | Separate request flow vs offer | Partial | **Moderate** |
| Exchange value (barter) | Proposal → deal | Chat-first; no cart shortcut | Yes — intentional | **Good** for mission |
| Contact neighbour | Message seller | Soft auth if logged out | Yes — resume intent | **Good** |
| Complete order | Pay → deliver → confirm | Checkout i18n gaps; buyer no self-refund | Yes — order tracking exists | **Moderate** |
| Arrange delivery | Shift + payout | Courier onboarding complexity | Yes | **Moderate** |
| Become affiliate | Signup + share | Agreement checkboxes; separate from HCP | Neutral | **OK** |
| Manage small business | Dashboard + analytics | Some analytics promised but unimplemented | Partial | **Moderate** |
| Resolve problem | Dispute/refund | **Buyer has no self-service path** | No | **Gap** |
| Leave after task | Close app | No punishment; caches help return | **Yes** — aligned with mission | **Good** |

### Proposed time-to-useful-outcome KPIs

| KPI | Currently tracked? | Derivable? |
|-----|-------------------|------------|
| Visit → meaningful listing view (≥10s or scroll depth) | Partial (`track-view`) | Yes |
| Visit → first message | No funnel | Yes from `conversations` |
| Registration → first listing | `SELLER_ACTIVATION_*` events | Yes |
| Request → first relevant response | No | Yes from proposals |
| Order → DELIVERED | Yes (order status) | Yes |
| Affiliate share → legitimate registration | Attribution cookie + signup | Yes |
| Seller signup → first revenue | No dedicated event | Yes from `Transaction` |
| Session duration (inverse goal) | Not as KPI | Yes — use as guardrail, not target |

---

# Part 4 — Local social cohesion audit

| Question | Evidence | Assessment |
|----------|----------|------------|
| Discover people nearby, not only products? | Profiles, public pages, follow, seller on tiles | **Partial** — product-first UI |
| Ask for help without feeling like a buyer? | Request listings, proposals, community orders | **Yes** — request intent exists |
| Older / less technical users? | i18n, tours opt-in, soft gates | **Partial** — checkout NL-hardcoded, alerts |
| Repeated local relationships visible? | Follow, fans, deal history in chat | **Partial** — not highlighted in feed |
| Reward reliability and contribution? | Trust tiers, completed deals in ranking, HCP for deals | **Yes** — ranking favors trust |
| Businesses crowd out neighbours? | Paid boost capped at 0.08 on **unused** baseline profile; badges visible | **Low risk today** — boost not live in feed |
| Ranking preserves local diversity? | Section profiles (`new_creators`, `trusted_maker`), distance weighting | **Yes** — intentional diversity sections |

**Opportunities (no new social network):**
- Surface "makers you've bought from again" (relationship memory, not feed posting)
- Highlight completed neighbour-help deals in local digest (not leaderboard)
- Repeat-local-buyer badge on profiles (trust, not vanity)

---

# Part 5 — Local economic opportunity audit

### Fee structure (code SSOT: `lib/business/visibility-profile.ts`)

| Plan | Platform fee | Monthly |
|------|-------------|---------|
| Individual | 12% | €0 |
| Basic | 9% | €39 |
| Pro | 7% | €99 |
| Premium | 5% | €199 |

Stripe (1.4% + €0.25) passed to **buyer**. Delivery: 88% deliverer / 12% platform.

### Fairness evaluation

| Check | Finding |
|-------|---------|
| Fees understandable? | **Mostly** — pricing page + DNA comparison exist |
| Paid visibility bounded? | **Capped at +0.08** in code — but **not applied to live feed sections** |
| Individual can succeed without subscription? | **Yes** — economically possible; higher fee (12%) |
| Business subscription value real? | **Partial** — lower fees + badges real; some analytics **unimplemented** |
| Affiliate earns from genuine value? | **Yes** — commission on platform fee from real orders (not barter) |
| Couriers understand gross vs net? | **Partial** — earnings APIs exist; UX clarity varies |
| Pushed unfairly toward paid tiers? | **Risk** — DNA preview shows visibility score multiplier not used in ranking |

### Mission vs profitability balance

- **Social mission:** Multiple settlement paths let low-income users participate without Stripe.
- **Marketplace fairness:** Subscribers pay less per transaction — rational but creates two-tier economics.
- **HomeCheff profitability:** Needs volume + subscriptions; affiliate can absorb up to ~50% of platform fee.
- **Investor scalability:** Tiered B2B + affiliate tree is scalable; must not outrun local supply quality.

**Honest tension:** Barter and direct contact advance the social mission but **reduce platform revenue and buyer protections** — must be disclosed, not hidden.

---

# Part 6 — Algorithm and discovery audit

### Known ranking inputs (live section profiles)

| Signal | Used in | Capped? |
|--------|---------|---------|
| `distance_km` | nearby, baseline | — |
| `recency` | trending, baseline | Decay 7–90 days |
| `trust_tier_seller` | multiple profiles | Tier gates |
| `favorite_count_limited` | baseline, trending | Cap 5 |
| `completed_deals` | baseline, trusted_maker | Cap 20 |
| `business_visibility_boost` | **baseline only** | Cap 0.08 |
| `view_count` | **client "popular" sort** | **Not capped — contradicts anti-gaming** |
| Follow tie-break | `local-discovery.ts` | Within 7 days |

### Opaque / untracked

- Client-side re-sorts after server response
- DNA `visibilityMultiplier` (UI preview only)
- Homepage spotlight eligibility flags (not verified in feed assembly)

### Philosophy alignment

| Question | Answer |
|----------|--------|
| Local relevance dominates popularity? | **Mostly in server discovery**; weakened by client popular sort |
| New users discoverable? | **Yes** — `new_creators` section (≤30 days, tier ≤2) |
| Premium drowns individuals? | **Not currently** — paid boost not wired to live ranking |
| Paid boosts capped enough? | **Yes in code** — if ever wired |
| Diversity preserved? | **Yes** — section registry |
| Narrow recommendation loops? | **Low risk** — no ML loop; user controls radius/filters |
| User can influence results? | **Yes** — radius, category, offered/wanted, accepted values |

**No ranking changes in this audit** (per scope). **P1:** Align client popular sort and marketing claims with anti-gaming contract.

---

# Part 7 — Notifications and communication ethics

| Source | Type | Default | Classification |
|--------|------|---------|----------------|
| Messages | Transactional | On | **Necessary transactional** |
| Orders | Transactional | On | **Necessary transactional** |
| Proposals / deals | Transactional | On | **Necessary transactional** |
| Delivery shifts | Transactional | On | **Necessary transactional** |
| Security | Transactional | On (SMS too) | **Necessary transactional** |
| Favorites / props / follows | Social | On | **Useful optional** |
| New products (followers) | Social | On | **Useful optional** |
| Nearby products probe | Discovery | Off (`pushNearbyProducts`) | **Potentially excessive** when enabled |
| HCP rewards | Gamification | In-app badge only | **Healthy** (no push spam) |
| Marketing email/push | Promotional | **Off** | **Healthy default** |
| Affiliate | Mixed | Contextual | **Useful optional** |
| Business growth | Promotional | Gated | **Promotional** — should stay opt-in |

### Controls audit

| Control | Status |
|---------|--------|
| Per-channel toggles | ✅ |
| Quiet hours | ✅ (22:00–08:00 default when enabled) |
| Quiet hours timezone | ❌ Uses server clock, not `User.timezone` |
| Batching | Partial (cron batches delivery) |
| Unsubscribe | ✅ via prefs |
| Push permission timing | Beta onboarding gate — explicit |
| Emotional pressure copy | Mostly neutral; nearby probe is FOMO-lite |

### Recommended hierarchy

1. **Urgent transactional** (security, active order) — always on, bypass quiet hours  
2. **Transactional** (messages, orders, delivery) — on by default, user can disable non-security  
3. **Social** (follows, favorites) — on by default  
4. **Discovery** (nearby products) — **off by default** (already)  
5. **Promotional** (marketing, business growth) — **off by default** (already)

---

# Part 8 — Gamification and HCP audit

| Mechanism | Rewards | Classification |
|-----------|---------|----------------|
| Deal completion HCP | Real transactions | **Mission aligned** |
| Review / contribution actions | Useful participation | **Mission aligned** |
| Props (capped 15/day) | Appreciation | **Mission aligned** |
| Daily login + streak | Opening app | **Needs safeguards** |
| 7-day streak bonus | Compulsive return | **Needs safeguards** |
| Weekly login mission | Compulsive return | **Needs safeguards** |
| Leaderboards | Comparison / status | **Needs safeguards** |
| Weekly spotlight | Visibility competition | **Needs safeguards** |
| Visibility rewards at 500/1000 HCP | Profile boost | **Mission aligned** if tied to contribution history |
| Reward catalog disclaimers (no cash) | Transparency | **Mission aligned** |

**Not encouraged (good):** meaningless clicks, spam listings for points (publish gates exist), HCP per scroll.

**Recommendation:** Tie streak UI to **completed useful actions** in the same week, or replace streak anxiety with **contribution streak** (deals, messages that led to deals).

---

# Part 9 — Trust, inclusion and vulnerable users

| Group | Support | Gaps |
|-------|---------|------|
| Older users | Large touch targets in places; opt-in tours | Inconsistent a11y; `alert()` dialogs |
| Low-income users | Barter, direct contact, individual tier free | Stripe gate for paid checkout |
| Limited digital skills | Soft gates, resume intents | Complex seller/delivery onboarding |
| Disabilities | Some `aria-label`, reduced motion | No global WCAG audit; cookie banner a11y |
| Without Stripe | Barter/direct paths | Paid selling requires Connect |
| Without business registration | Individual seller path | — |
| Minors in delivery | Signup flows exist | Age policy relies on terms — verify operationally |
| Language barriers | nl/en i18n | Checkout hardcoded Dutch in places |
| Loneliness / unemployment | Community, requests, local discovery | **Not measured**; avoid therapeutic claims |

### Trust/safety mechanisms

| Mechanism | Status |
|-----------|--------|
| Reporting | **Chat only** — safety page promises more |
| Suspension | Admin API exists; **only checkout enforced** |
| Disputes/refunds | Admin + Stripe; **no buyer self-service** |
| Account deletion | Strong anonymization |
| GDPR export | **Stub — critical gap** |

**Do not claim full inclusion** until export works, suspension is global, reporting matches safety page, and checkout is fully i18n.

---

# Part 10 — Privacy and autonomy

| Control | User understands? | Enforced? | Classification |
|---------|-------------------|-----------|----------------|
| Location (GPS) | Browser prompt | Opt-in | **Useful with consent** |
| Profile visibility | Privacy settings UI | Yes (mostly) | **Required / useful** |
| Message privacy | UI | Yes | **Required** |
| `allowProfileViews` | **No UI** | **No** | **Unnecessary collection** |
| Notifications | Full UI | Yes | **Useful with consent** |
| Analytics | Cookie banner | Consent-gated | **Useful with consent** |
| Affiliate attribution | Disclosed in affiliate flow | Cookie 30d | **Required for service** (affiliate) |
| Cookies | Banner | Client-only | **Useful with consent** |
| Recommendation state | Filters in feed | User-controlled | **Useful** |
| Account deletion | 3-step flow | Yes | **Required** |
| Data retention | Documented 6–24 mo | Policy only; no purge job | **Required** — needs automation |

**Concerns:** Client-only consent (no revoke in settings); profile views tracked despite privacy field; quiet hours ignore timezone.

---

# Part 11 — Honest growth model

| Loop | Value-based? | Risk |
|------|--------------|------|
| Referral links + QR | Yes — if local supply exists | Spam invites |
| Affiliate attribution | Yes — on real orders | MLM-adjacent tree language |
| HCP recognition | Yes — contribution | Streaks ≠ growth |
| Business subscriptions | Yes — fee reduction | Overpromised boost |
| Share buttons | Neutral | Low risk |
| Local ambassadors (pilot) | Yes — municipality fit | Needs measurement |

**Growth should come from:** successful transactions, useful invitations, community reputation.  
**Risks:** affiliate overpayment shrinking margin; growth without local supply; misleading subscription visibility claims.

**Ethical growth loop:** Invite neighbour → they find local maker → transaction completes → both benefit. Track **invite → registration → first local transaction within 30 days**.

---

# Part 12 — Social-impact measurement

| Metric | Tracked now? | Derivable? | Consent needed? | Gaming risk | Value |
|--------|-------------|------------|-----------------|-------------|-------|
| Local income generated (GMV/net seller) | Transactions | Yes | Low | Medium | High |
| First-time sellers earning revenue | No event | Yes | Low | Low | High |
| Value exchanged without money | Barter deals | Partial | Low | Medium | High |
| Neighbour-help requests fulfilled | Community orders | Yes | Low | Low | High |
| Repeat local relationships | No UI metric | Yes | Low | Low | High |
| Food/garden surplus redistributed | No | Hard | — | High if claimed | Medium |
| Travel distance avoided | No | Estimate from coords | Medium | Medium | Medium |
| Active local makers | Seller counts | Yes | Low | Low | High |
| Completed community orders | Order status | Yes | Low | Low | High |
| % transactions in pilot region | Geo on orders | Yes | Low | Low | High (municipality) |
| Users reporting stronger connection | **No** | Survey | **Yes** | Low | High |

**No fake impact numbers.** Pilot should start with **derivable** metrics from existing order/transaction tables before surveys.

---

# Part 13 — Ethical product scorecard

Scores 1–10 with evidence. **Uncertainty noted where evidence is incomplete.**

| Domain | Score | Evidence | Uncertainty |
|--------|-------|----------|-------------|
| Respect for time | **7** | 13N caches, bounded feed, task empty states | Streaks/polling pull opposite |
| User autonomy | **6** | Notification/privacy controls | Export stub; dead privacy fields |
| Social cohesion | **7** | Geo, requests, barter, community orders | Product-first UI; relationships not surfaced |
| Local opportunity | **8** | Multi-settlement, individual tier, delivery | Stripe gate; €2k cap fiction |
| Marketplace fairness | **6** | Anti-gaming caps, new_creators section | Client popular sort; marketing vs wiring |
| Transparency | **5** | HCP disclaimers, affiliate FAQ | DNA boost not live; analytics gaps |
| Privacy | **6** | Consent analytics, deletion, delivery masking | Profile views; no export |
| Inclusion | **5** | i18n exists | Checkout NL; a11y spotty |
| Trust and safety | **6** | Admin refunds, escrow, trust tiers | Suspend gaps; reporting gaps |
| Healthy engagement | **6** | Activation safety, caps, no ads | Streaks, leaderboards, polling |
| Financial sustainability | **7** | Tiered model, fees, delivery cut | Affiliate fee share; barter bypass |
| Measurable impact | **4** | Transaction data exists | No impact dashboard; no surveys yet |

**Average: ~6.2/10** — directionally ethical, not yet fully instrumented or consistent.

---

# Part 14 — Findings and priorities

### P0 — Contradicts mission or serious harm/trust risk

| ID | Finding | Type |
|----|---------|------|
| P0-1 | GDPR data export is a UI stub (`DeleteAccount.handleDataExport`) | Policy / product |
| P0-2 | Suspension enforced only on checkout — messaging/listing still work | Product / operational |
| P0-3 | Subscription "discovery boost" marketed in DNA/sell UI but **not applied to live feed ranking** | Copy / transparency |

### P1 — Improve before scaling

| ID | Finding | Type |
|----|---------|------|
| P1-1 | Client "popular" sort uses raw `viewCount` — contradicts anti-gaming | Product |
| P1-2 | Reporting only in chat; safety page promises listing/profile reports | Product |
| P1-3 | `allowProfileViews` not enforced; profile views always tracked | Privacy |
| P1-4 | €2,000 individual revenue cap advertised, not enforced | Policy / copy |
| P1-5 | Quiet hours ignore user timezone | Product |
| P1-6 | HCP daily login streak + auto-award on `/me` — habit loop | Strategic / product |
| P1-7 | Nearby products 30-min probe — FOMO-lite re-engagement | Product |
| P1-8 | Buyer no self-service dispute/refund path | Operational |
| P1-9 | Premium analytics features listed but unimplemented | Copy |
| P1-10 | Consent cannot be revoked in settings | Privacy |

### P2 — Pilot / 30–90 days

| ID | Finding | Type |
|----|---------|------|
| P2-1 | Time-to-outcome KPI dashboard | Analytics |
| P2-2 | Impact metrics from transactions (no surveys first) | Analytics |
| P2-3 | Replace streak with contribution-based recognition | Product |
| P2-4 | Mount reporting on listing + profile | Product |
| P2-5 | Wire paid boost OR remove from marketing copy | Strategic |
| P2-6 | Global a11y pass on checkout + cookie banner | Product |
| P2-7 | `GDPR_DYNAMIC_SELLER` anonymization TODO | Policy |

### P3 — Scale phase

| ID | Finding | Type |
|----|---------|------|
| P3-1 | Municipality impact reporting | Strategic |
| P3-2 | Algorithmic accountability page ("why you see this") | Product |
| P3-3 | Retention purge automation (6–24 mo) | Operational |
| P3-4 | Selective prefetch on high-intent paths | Product |
| P3-5 | Relationship memory UI (repeat local buyers) | Product |

---

# Part 15 — Philosophy-aligned roadmap

## Before / during pilot

- Fix P0-1 export or remove export button until real
- Fix P0-2 suspension on messaging + listing create
- Fix P0-3 marketing truth — either wire boost to one live section or revise DNA/sell copy
- Ship derivable impact metrics (GMV, first seller revenue, community orders, pilot-region %)
- Document barter/direct = no escrow/fee clearly at proposal CTA

## After 30–90 days of real usage

- Evaluate streak/HCP login loop against actual retention vs completion data
- A/B respectful notification defaults (nearby off everywhere)
- Time-to-outcome funnels from onboarding analytics
- User comprehension survey on fees (not NPS vanity)
- Decide popular sort fate with behavioral evidence

## Scale phase

- Impact reporting for municipalities / investors (verified metrics only)
- "Why this listing" transparency for ranking inputs
- Contribution-based recognition replacing vanity leaderboards if data shows misfit
- Deeper community infrastructure without passive posting feed

**Do not delay pilot** for speculative perfection — P0s are trust/legal, not polish.

---

# Part 16 — Founder verdict

### 1. Does HomeCheff currently embody the founder's philosophy?

**Partially — strongly in architecture, uneven in execution.** The platform is built around local commerce, real settlement paths, and explicit anti-manipulation rules. It is not an ad-driven attention product. But engagement borrowings (streaks, leaderboards, ambient polling) and transparency gaps (subscription boost, export stub) prevent a full "yes."

### 2. Where does it already outperform conventional social platforms ethically?

- No advertising feed or engagement-maximization business model  
- Bounded feed with stale-while-revalidate (not infinite scroll addiction)  
- Explicit `activation-safety.ts` blocking shame, pressure, romantic targeting  
- Consent-gated analytics with GA privacy flags  
- Multiple settlement paths including barter and neighbour help  
- Marketing notifications **off by default**  
- HCP does not push-notify every point  
- Real-world activations and community orders — not just passive posting  
- Phase 13N: respects time in navigation (no double skeletons, return caches)

### 3. Where does it still behave like a conventional engagement platform?

- UTC login streaks with reset penalty  
- Leaderboards and "you could be featured here" copy  
- 45s notification badge polling  
- 30-minute nearby-products probe  
- Animated pulse/bounce on props and follow buttons  
- Interleaved growth cards in feed (capped but present)  
- Client-side popularity sort by view count  

### 4. Can it be financially successful without compromising the mission?

**Yes, with discipline.** Tiered subscriptions, platform fees, and delivery cuts are honest models. Risks: affiliate fee share eroding margin; barter/direct reducing fee base; overpromising subscription visibility; racing to engagement tactics when growth stalls. Success looks like **sustainable fee revenue from real transactions**, not DAU maximization.

### 5. Which three product principles must never be compromised?

1. **Real-world value over screen time** — success = completed local outcomes, not session length  
2. **Transparency over growth hacking** — fees, boosts, and data use must match what the product actually does  
3. **Dignity of ordinary participants** — individuals must be able to succeed without paying for visibility; vulnerable users must not be tricked, tracked, or trapped  

### 6. What should HomeCheff ultimately be known for?

**The local platform where neighbours discover each other, exchange real value, and build small economic independence — without being farmed for attention.**

Not: "the local social app." Not: "the next marketplace unicorn." But: **opportunity infrastructure for ordinary people** — polished, fast, respectful, and measurably good for communities.

---

## Appendix — Key evidence files

```
lib/discovery/activations/activation-safety.ts
lib/discovery/activations/activation-anti-spam.ts
lib/business/visibility-profile.ts
lib/discovery/ranking/business-visibility-boost.ts
lib/discovery/ranking/ranking-profiles.ts
lib/geo/local-discovery.ts
lib/feed/feed-client-sort.ts
lib/gamification/daily-login-hcp.ts
lib/gamification/hcp-notifications.ts
lib/gamification/interaction-hcp.ts
lib/notifications/notification-service.ts
lib/account-deletion.ts
lib/user-suspend.ts
lib/affiliate-config.ts
lib/affiliate-commission.ts
components/ConsentAwareAnalytics.tsx
components/profile/DeleteAccount.tsx
components/profile/NotificationSettings.tsx
components/notifications/NotificationProvider.tsx
components/notifications/NotificationBell.tsx
app/api/checkout/route.ts
app/api/gamification/me/route.ts
docs/audits/INSTANT_EXPERIENCE_PHASE13N_AUDIT.md
```

---

*Audit only. No product changes implemented in Phase 13O unless a separate P0 fix is approved.*
