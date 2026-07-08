# Pilot Launch Readiness — Phase 10A Audit

**Date:** 2026-07-08  
**Method:** Codebase-first walkthrough of every user journey (guest → transaction). Reuses canonical systems from Phases 7A–9B. No redesign, no new architecture.  
**Verdict:** **Pilot-ready for NL city launch** with documented P1 polish items. EN pilot unblocked after orders i18n fix in this phase.

---

## Executive summary

HomeCheff is a **full local craft, exchange and community platform** in code: discovery pillars (Aangeboden, Gezocht, Inspiratie, Diensten), settlement router (checkout + proposal + barter + accepted values), reverse discovery, taxonomy SSOT, Stripe Connect guidance, and brand alignment (9B).

| Area | Status | Notes |
|------|--------|-------|
| Guest → register → discover | ✅ Ready | SEO hub, city pages, FAQ, About aligned (9B) |
| Buyer journey | ✅ Ready | Settlement CTAs via `settlement-router.ts`; orders i18n fixed (10A) |
| Seller journey | ✅ Ready | Edit settlement prefill fixed (10A); duplicate Stripe banner remains P2 |
| Gezocht / reverse discovery | ✅ Ready | End-to-end via 8C |
| Services | ✅ Ready | Create, discover, book, settle |
| Value economy messaging | ⚠️ Mostly | Surfaces show accepted values; some “te koop” form labels remain |
| Marketplace consistency | ⚠️ Mostly | Tile pipeline unified; mobile detail duplicate CTAs |
| Trust | ✅ Ready | Reviews, Connect, settlement explanations on detail |
| Performance | ⚠️ Watch | GeoFeed refetch on viewer coords; no new regressions introduced |
| Mobile / a11y | ⚠️ Polish | Bottom nav semantics; filter sheet focus trap |
| SEO (9B verify) | ⚠️ Mostly | Sitemap missing `/faq`, `/over-ons`; `gemeenschap` EN metadata |
| Scale 100–500 users | ✅ | Current architecture sufficient |
| Scale 1,000+ / ambassadors | ⚠️ | Monitor feed client filtering; ops dashboards exist |

**Pilot blockers fixed in 10A:**
1. Edit listing did not prefill settlement booleans → sellers could accidentally overwrite checkout/contact settings.
2. `/orders` hardcoded Dutch → EN pilot users saw wrong language.

---

## 1. Guest experience

### Landing & hero
- **Homepage** (`HomePageClient`, `HomeHeroSection`): Dorpsplein framing, value-economy hero (`homePhase1.heroDefinition`), discovery pillars (5C).
- **Guest restrictions:** Checkout, favorites toggle, proposals require login — correct gates via session checks and settlement router.

### Navigation
- **Desktop:** `NavBar.tsx` — home, werken-bij, messages, HCP, profile dropdown (orders, favorites, deals, settings).
- **Mobile:** `BottomNavigation.tsx` — Discover, Create, Messages, HCP, Profile.
- **Guest CTAs:** Login/register links on restricted surfaces; guest sales info panel on homepage.

### Discovery & marketplace entry
- Feed via `GeoFeed.tsx` + `/api/feed` — canonical tile pipeline.
- SEO entry: `/seo-hub`, `/maaltijden/[stad]` (broad copy, food URL kept), category ecosystem pages.

### FAQ / About / registration
- FAQ `general.0`/`general.1` — platform + exchange (9B).
- About (`overOns`) — craft, services, Gezocht, value exchange (9B).
- Register/login flows use i18n; onboarding branches cover 4 categories (`onboardingBranch.*`).

### Findings
| ID | Severity | Finding |
|----|----------|---------|
| G1 | P2 | `/favorites` shows empty list for guests instead of login CTA |
| G2 | P2 | `DiscoverHubClient` fallback copy still uses “te koop” in one path |

---

## 2. Buyer journey

### Discover → filters → reverse discovery
- Pillar chips, accepted-value discovery, category/view filters — `GeoFeed`, discovery filters (7E/8B).
- Reverse discovery (8C): buyer accepted values surface matching listings.

### Open listing → trust → settlement
- Detail: `ProductDetailMainSections`, `ProductDetailSettlementSection`, trust/reviews.
- CTAs: `ProductSalePrimaryActions`, `ProductSaleStickyCta`, `MarketplacePreviewActions` → **`settlement-router.ts`** (8E).
- Checkout gate: `/api/checkout` uses `productAllowsHomecheffCheckout` / `resolveCheckoutBlockReason`.

### Proposal → chat → checkout → orders
- `CreateProposalSheet` uses settlement options from product booleans.
- Chat threads linked from orders via `OrderMessageButton`.
- **Fixed (10A):** `/orders` now uses `useTranslation` + `orders.*` / `order.status*` keys (NL/EN).

### Favorites, profile, notifications
- Favorites API + profile tab wired; guest empty state (G1).
- Notifications in header dropdown.

### Findings
| ID | Severity | Finding |
|----|----------|---------|
| B1 | ~~P0~~ | ~~Orders page hardcoded Dutch~~ → **Fixed 10A** |
| B2 | P2 | Mobile product detail shows inline + sticky CTAs (duplicate affordance) |
| B3 | P2 | Some status chips may differ wording from `order.*` keys on seller ops views |

---

## 3. Seller journey

### Register → profile → Stripe Connect
- Seller dashboard `/verkoper`, `StripeConnectPaymentsBanner`, `SettlementConnectGuidance` on create/edit.
- Connect readiness gates **public** checkout advertisement, not publication (7C).

### Create / edit listing
- `MarketplaceOfferForm` — taxonomy, accepted values, barter openness, settlement checkboxes.
- **Fixed (10A):** Edit mode prefills `acceptHomeCheffPayment` / `acceptDirectContact` via `resolveSettlementOptions` SSOT; edit page passes booleans from API.

### Pending taxonomy proposals
- `AcceptedValuesPicker` + pending proposal flow preserved (taxonomy SSOT).

### Publish → manage → orders → messages
- Publish gate via `resolveProductPublishState`; listings visible without Connect for contact-only.
- Seller orders in operations shell; messages integrated.

### Findings
| ID | Severity | Finding |
|----|----------|---------|
| S1 | ~~P0~~ | ~~Edit form settlement booleans not prefilled~~ → **Fixed 10A** |
| S2 | P2 | `StripeConnectPaymentsBanner` on edit page duplicates `SettlementConnectGuidance` in form |
| S3 | P2 | Onboarding “Services” path may route to `/sell` (subscriptions) vs `/sell/new` |

---

## 4. Wanted (Gezocht) journey

- Create request: listing intent `REQUEST`, Gezocht feed chip.
- Discovery: reverse matching on accepted values (8C).
- Proposal → chat → settlement → completion: same settlement router paths as offers.
- **Status:** ✅ End-to-end ready.

---

## 5. Service provider journey

- Create: SERVICE / TASK / WORKSHOP / COACHING via marketplace taxonomy.
- Discover: Diensten pillar + filters.
- Bookings / orders / settlement / trust: wired through operations and detail CTAs.
- **Status:** ✅ Ready; S3 onboarding path note applies.

---

## 6. Alternative value economy

### Canonical path (unchanged)
```
canonical-model.ts → settlement-options.ts → settlement-router.ts → UI CTAs
```

### Surfaces audited
| Surface | Accepted values | Barter | Mixed settlement | Proposal |
|---------|----------------|--------|------------------|----------|
| Tile row | ✅ | ✅ | ✅ | ✅ |
| Preview card | ✅ | ✅ | ✅ | ✅ |
| Detail section | ✅ | ✅ | ✅ | ✅ |
| Create/edit form | ✅ | ✅ | ✅ | N/A |
| Reverse discovery | ✅ | — | ✅ | — |
| Chat proposal | ✅ | ✅ | ✅ | ✅ |

### Messaging
- FAQ, About, hero, discover hub subtitle (“aangeboden”) communicate exchange.
- **Remaining drift:** form labels `putForSale`, some “te koop” in seller copy (9B deferred).

**Platform communicates “shop with what you have” on primary buyer surfaces;** legacy money-first labels linger in secondary form chrome.

---

## 7. Marketplace consistency

All surfaces route through tile pipeline (`map-to-tile-model`, `build-tile-settlement-row`) and settlement SSOT.

| Surface | Tile model | Settlement row | CTA router |
|---------|------------|----------------|------------|
| Homepage feed | ✅ | ✅ | ✅ |
| Search / filters | ✅ | ✅ | ✅ |
| Profile listings | ✅ | ✅ | ✅ |
| Favorites | ✅ | ✅ | ✅ |
| Preview | ✅ | ✅ | ✅ |
| Detail | ✅ | ✅ | ✅ |
| Seller profile | ✅ | ✅ | ✅ |
| Gezocht | ✅ | ✅ | ✅ |
| Messages / orders | N/A | contextual | ✅ |

**Empty states:** Generally present; guest favorites (G1) weak.

---

## 8. Homepage audit

- **Left sidebar:** Quick links, Gezocht surface (5A), ecosystem strip (5C).
- **Center feed:** `GeoFeed` with pillar chips, filters, inspiratie section.
- **Right cockpit:** Growth, community, quick actions.
- **Responsive:** Desktop 3-column; tablet/mobile stack; bottom nav on mobile.
- **Density:** Information-rich by design; filter sheet on mobile.

---

## 9. Navigation audit

| Question | Answer |
|----------|--------|
| Where am I? | Page titles + breadcrumbs on key flows; homepage anchor `#homecheff-feed` |
| What can I do? | Role-based quick links + create FAB |
| What happens next? | Settlement router labels guide checkout vs proposal |
| Dead ends? | Few; guest favorites weak (G1) |
| Duplicate actions? | Mobile detail dual CTAs (B2) |
| Confusing labels? | “Te koop” vs “Aangeboden” in isolated strings |

---

## 10. Trust audit

- Trust score / reputation / reviews on profiles and detail.
- Stripe Connect: banner + `SettlementConnectGuidance`.
- Settlement explanations on detail (`ProductDetailSettlementSection`).
- Accepted values + proposal safety via chat + structured proposals.
- Checkout safety: Stripe + API gate.
- Community trust: deals, delivery trust profile links.

**Status:** ✅ Adequate for pilot.

---

## 11. Performance audit

**Architecture preserved (Phase 4):** single feed fetch, client-side filter refinement (8B), no extra providers.

| Check | Result |
|-------|--------|
| Duplicate feed providers | None added |
| GeoFeed refetch on coords | ⚠️ Possible second fetch when `effectiveViewerForDistance` updates after geolocation |
| SSR + client inspiratie | ⚠️ Known duplication by design |
| Heavy client filtering | By design (8B); acceptable for pilot scale |
| Settlement calculations | Synchronous SSOT; no duplicate per surface |

**No regressions introduced in 10A** (copy/i18n/prefill only).

---

## 12. Mobile audit

- Cards: touch-friendly tile heights.
- Filters: bottom sheet; no focus trap (P2 a11y).
- Bottom nav: sticky; missing `<nav>` / `aria-current` (P2).
- Keyboard: forms generally OK; filter sheet gap.
- Safe areas: `min-h-[100dvh]` on key forms.
- Sticky CTAs: product detail sticky bar (B2 duplicate with inline).

---

## 13. Accessibility audit

- Contrast: design system tokens (6A).
- Keyboard: most interactive elements focusable.
- Screen readers: partial — bottom nav, filter sheet need improvement.
- Loading: skeleton states on feed/orders.
- Tap targets: generally ≥44px on primary CTAs.

---

## 14. SEO audit (9B verification)

| Item | Status |
|------|--------|
| Homepage meta / Organization schema | ✅ Broad platform (9B) |
| SEO hub | ✅ Ecosystem sections |
| City pages | ✅ Broad H1/titles; `/maaltijden/` URLs kept |
| FAQ / About content | ✅ Rewritten (9B) |
| Manifest | ✅ Multi-category |
| Structured data | ✅ FAQ JSON-LD updated |
| Titles / descriptions | ✅ Aligned |
| Canonical / OG / Twitter | ✅ Present on layout |
| Internal linking | ✅ SEO hub ecosystem links |
| Sitemap | ⚠️ Missing `/faq`, `/over-ons` |
| hreflang | ✅ EN prefix routes |
| Brand consistency | ✅ No meal-first except intentional food SEO |
| `gemeenschap/[segment]` metadata | ⚠️ Always NL |

---

## 15. Terminology audit

| Term | Canonical | Drift found |
|------|-----------|-------------|
| Aangeboden | `marketplace.canonical.view.offered` | Discover hub ✅; some “te koop” |
| Gezocht | REQUEST intent | ✅ |
| Inspiratie | Feed chip | ✅ |
| Food / Garden / Creations | Taxonomy | ✅ |
| Services | Diensten pillar | ✅ |
| Settlement | settlement-options SSOT | ✅ |
| Proposal | settlement-router | ✅ |
| Accepted / alternative values | i18n + pickers | ✅ |
| HomeCheff Checkout | `marketplace.cta.*` | ✅ |

---

## 16. Future pilot readiness

| Scale | Assessment |
|-------|------------|
| 100 users | ✅ Ready — current UX + ops sufficient |
| 500 users | ✅ Ready — monitor feed latency |
| 1,000 users | ⚠️ Client-side filtering may need server-side pagination tuning |
| City pilot | ✅ Ready (NL); EN after 10A orders fix |
| Ambassadors / local businesses | ✅ Growth surfaces + affiliate |
| Workshops / neighbour help | ✅ Taxonomy + services |
| Alternative economy | ✅ Core flows complete; copy polish ongoing |

---

## 17. Targeted improvements (10A)

| Change | Rationale |
|--------|-----------|
| Edit settlement prefill | Prevent accidental settlement overwrite on edit |
| Orders page i18n | EN pilot blocker |
| Validator + docs | Pin readiness state |

**Deferred (P2, not pilot blockers):**
- Guest favorites login CTA
- Sitemap `/faq`, `/over-ons`
- Mobile detail duplicate CTAs
- Remove duplicate Stripe banner on edit
- `gemeenschap` EN metadata
- Remaining “te koop” form labels

---

## Architecture confirmation (unchanged)

- `lib/marketplace/canonical-model.ts`
- `lib/marketplace/settlement/settlement-options.ts`
- `lib/marketplace/settlement/settlement-router.ts`
- Reverse discovery (8C)
- Taxonomy SSOT + pending proposals
- Marketplace tile pipeline
- Discovery filters, profile mapping, CTA router
- HomeCheff Checkout + Stripe Connect guidance

No parallel implementations. No new providers. No duplicate settlement logic.
