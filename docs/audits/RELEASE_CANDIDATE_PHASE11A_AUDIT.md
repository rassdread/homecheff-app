# Release Candidate RC1 — Phase 11A Final Acceptance Audit

**Date:** 2026-07-08  
**Method:** Full-application walkthrough as if launching tomorrow to real users in the first city pilot. Reuses frozen architecture from Phases 7A–10E. No redesign, no new systems, no feature creep.  
**Verdict:** **HomeCheff Release Candidate RC1 is approved for the first city pilot.**

---

## Executive summary

HomeCheff is **feature-complete** for the Vlaardingen city pilot. Canonical marketplace architecture (intent / category / settlement axes), reverse discovery, accepted values, settlement router, tile pipeline, taxonomy SSOT, and Stripe Connect guidance are intact and wired end-to-end.

| Area | Status | Notes |
|------|--------|-------|
| Guest → register → discover | ✅ Ready | Hero USP, SEO hub, FAQ, About, city pages |
| Buyer journey | ✅ Ready | Browse, filter, reverse discovery, detail, proposal, checkout, orders |
| Seller journey | ✅ Ready | Create/edit with settlement prefill, Connect guidance, publish, manage |
| Gezocht / reverse discovery | ✅ Ready | Direction toggle + accepted-values filter persisted (10D) |
| Services & neighbour help | ✅ Ready | Services is category axis; mobile filter parity fixed (11A) |
| Value economy | ✅ Ready | Accepted values on tiles, detail, create, reverse discovery |
| Trust | ✅ Ready | Reviews, Connect, settlement explanations, seller identity |
| Mobile / a11y | ✅ Ready | Single sticky CTA, filter sheet dialog, bottom nav labels |
| SEO / i18n | ✅ Ready | NL + EN parity on critical paths; sitemap complete |
| Data normalization | ⚠️ Ops | 10C/10E backfill ready; production write needs backup + confirmation |
| Architecture | ✅ Frozen | No parallel systems introduced in 11A |

**Pilot blocker fixed in 11A:**
- Mobile filter sheet category `<select>` omitted **Diensten / Services** while desktop sidebar and GeoFeed chips used canonical `DISCOVERY_CATEGORY_CHIP_OPTIONS`. Mobile users could not filter services category from the filter sheet.

---

## Severity legend

| Level | Meaning |
|-------|---------|
| **P0** | Must fix before launch |
| **P1** | Should fix before launch |
| **P2** | Can wait until after pilot |
| **P3** | Future improvement |

---

## 1. Guest visitor

### First impression (homepage, hero, USP)
- **Homepage** (`HomePageClient`, `HomeHeroSection`): Dorpsplein framing, `heroValueExchange` USP, discovery pillars.
- **Value exchange** visible in hero, discovery direction toggle tagline, settlement intro on create/detail (10C/10D).
- **Trust:** Public browse; login gates on checkout, favorites toggle, proposals.

### Discovery, search, SEO
- **GeoFeed** + `/api/feed` — canonical tile pipeline.
- **SEO:** `/seo-hub`, `/[seoSlug]`, `/en/[seoSlug]`, city pages; sitemap includes `/faq`, `/over-ons` (10B).
- **FAQ / About:** Platform + exchange messaging aligned (9B).

### Registration / login / empty states
- Register/login i18n; onboarding branches for food, garden, creations, services.
- **Favorites (guest):** Login CTA with benefits — fixed 10B (G1).
- No silent dead ends on primary discovery paths.

| ID | Severity | Finding | Status |
|----|----------|---------|--------|
| G1 | P2 | Guest favorites empty without CTA | ✅ Fixed 10B |
| G2 | P2 | Discover hub fallback “te koop” copy | ✅ Fixed 10B |
| G3 | P2 | Onboarding bullets still say “te koop” / “for sale” in NL/EN hints | Open — secondary copy |

---

## 2. Buyer journey

### Browse → filter → reverse discovery
- Pillar chips (`DISCOVERY_VIEW_CHIP_OPTIONS`), category chips (`DISCOVERY_CATEGORY_CHIP_OPTIONS`).
- **Reverse discovery:** `discoveryDirection` + `acceptedValues` in `hc_feed_surfaces_v2` (10D).
- Desktop sidebar, GeoFeed inline panel, mobile toolbar chips — aligned.

### Listing detail → settlement → proposal → checkout
- Detail: `ProductDetailSettlementSection`, trust/reviews.
- CTAs: `settlement-router.ts` on primary, sticky, preview actions.
- Checkout gate: `/api/checkout` + Connect readiness.
- **Orders:** i18n via `useTranslation` (10A).

### Messages, reviews, favorites, notifications
- Chat from orders and detail; reviews on completed orders.
- Favorites API + profile tab; notifications in header.

| ID | Severity | Finding | Status |
|----|----------|---------|--------|
| B1 | P0 | Orders page hardcoded Dutch | ✅ Fixed 10A |
| B2 | P2 | Mobile detail duplicate CTAs | ✅ Fixed 10B |
| B3 | P2 | Seller ops status chip wording drift | Open — cosmetic |
| **B4** | **P1** | **Mobile filter sheet missing Services category** | **✅ Fixed 11A** |

---

## 3. Seller journey

### Register → profile → Connect
- Seller dashboard `/verkoper`; `SettlementConnectGuidance` on create/edit (single guidance surface).
- Connect gates **public checkout advertisement**, not publication.

### Create / edit → settlement → accepted values → publish
- `MarketplaceOfferForm` — taxonomy, accepted values, barter, settlement checkboxes.
- Edit prefill via `resolveSettlementOptions` (10A).
- Pending taxonomy proposals via `AcceptedValuesPicker`.

### Manage → orders → messages → reviews
- Publish via `resolveProductPublishState`; listings visible for contact-only without Connect.
- Seller orders in operations shell.

| ID | Severity | Finding | Status |
|----|----------|---------|--------|
| S1 | P0 | Edit settlement booleans not prefilled | ✅ Fixed 10A |
| S2 | P2 | Duplicate Stripe banner on edit | ✅ Fixed 10B |
| S3 | P2 | Onboarding Services path may route to `/sell` vs `/sell/new` | Open — edge case |

---

## 4. Service provider & neighbour help

- **Services** is a **category** (canonical model), not a view intent.
- Create: SERVICE / TASK / WORKSHOP / COACHING via marketplace taxonomy.
- Discover: category filter `services` + Diensten pillar.
- **11A fix** ensures mobile filter sheet matches desktop for services filtering.

| ID | Severity | Finding | Status |
|----|----------|---------|--------|
| SP1 | P1 | Mobile filter could not select Services category | ✅ Fixed 11A |

---

## 5. Wanted requests (Gezocht)

- Create: `listingIntent: REQUEST`, Gezocht view chip.
- Discovery: reverse matching on accepted values (8C).
- Proposal → chat → settlement: same router as offers.
- Empty Gezocht state in GeoFeed when no requests match.

**Status:** ✅ End-to-end ready.

---

## 6. Alternative value economy

### Canonical path (unchanged)
```
canonical-model.ts → settlement-options.ts → settlement-router.ts → UI CTAs
```

### Surfaces audited
| Surface | Accepted values | Barter | Checkout | Proposal |
|---------|----------------|--------|----------|----------|
| Tile row | ✅ | ✅ | ✅ | ✅ |
| Preview card | ✅ | ✅ | ✅ | ✅ |
| Detail section | ✅ | ✅ | ✅ | ✅ |
| Create/edit form | ✅ | ✅ | ✅ | N/A |
| Reverse discovery filter | ✅ | — | — | — |
| Chat proposal sheet | ✅ | ✅ | ✅ | ✅ |

### Messaging
- Primary label: **Geaccepteerde waarden** / **Accepted values** (10B).
- Hero + discovery USP communicate value exchange (10C/10D).
- **Remaining drift:** barter guard message uses “te koop” / “for sale” (P2).

---

## 7. Page inventory

| Page / surface | Guest | Buyer | Seller | Notes |
|----------------|-------|-------|--------|-------|
| Homepage / GeoFeed | ✅ | ✅ | ✅ | Filter persist, USP |
| Sidebar / mobile filters | ✅ | ✅ | ✅ | Services parity 11A |
| Create / edit listing | — | — | ✅ | Settlement SSOT |
| Product detail | ✅ | ✅ | ✅ | Sticky CTA mobile |
| Preview (hover/long-press) | ✅ | ✅ | ✅ | Escape closes |
| Messages | gate | ✅ | ✅ | |
| Orders | gate | ✅ | ✅ | i18n |
| Deals / favorites | partial | ✅ | ✅ | Guest favorites CTA |
| Seller / public profile | ✅ | ✅ | ✅ | |
| Settings / notifications | gate | ✅ | ✅ | |
| Stripe onboarding | — | — | ✅ | Connect guidance |
| HCP / gamification | ✅ | ✅ | ✅ | |
| SEO / About / FAQ / Privacy / Terms | ✅ | ✅ | ✅ | |

---

## 8. Interaction audit

| Interaction | Status | Notes |
|-------------|--------|-------|
| Hover preview | ✅ | Escape; `role="dialog"` |
| Focus / keyboard | ✅ | Filter sheet focus on open, Escape close |
| Dialogs / sheets | ✅ | Filter sheet `aria-modal`; proposal sheet `aria-modal` |
| Sticky CTA | ✅ | Mobile-only; scrolls to `#detail-settlement` |
| Loading / skeletons | ✅ | Feed, detail, forms |
| Error / validation | ✅ | Forms, checkout block reasons |
| Empty states | ✅ | Feed pillars, Gezocht, favorites guest CTA |
| Permission gates | ✅ | Session checks on restricted actions |

| ID | Severity | Finding | Status |
|----|----------|---------|--------|
| A1 | P2 | `MarketplaceHoverPreview` has `role="dialog"` but no `aria-modal` | Open |
| A2 | P3 | Capacitor push debug panel (dev flag only) uses hardcoded NL | N/A prod |

---

## 9. Device audit

| Device | Status | Notes |
|--------|--------|-------|
| Desktop | ✅ | 3-column homepage; sidebar filters |
| Tablet | ✅ | Stacked layout; filter sheet |
| Mobile | ✅ | Bottom nav, sticky CTA, safe areas |
| Small screens | ✅ | Touch targets on chips and CTAs |
| Landscape | ✅ | No known blockers |

---

## 10. Accessibility

- Bottom nav `aria-label` (10B).
- Filter sheet: `aria-modal`, Escape, focus restore (10B).
- Proposal sheet: `aria-modal`, labelled dialog.
- Shared `Modal.tsx` component for standard dialogs.
- Reduced motion: no blocking animations on critical paths.

---

## 11. Trust comprehension

An ordinary user can understand:

| Question | Answer surface |
|----------|----------------|
| Who is selling? | Seller row on tile/detail, public profile |
| How to pay? | Settlement section + checkout CTA labels |
| How proposals work? | “Doe een voorstel” / proposal sheet |
| What HomeCheff Checkout does? | `settlement.intro` + checkout description |
| When direct contact is used? | Direct contact settlement row + CTA |
| Accepted values? | Detail section + reverse discovery filter |
| Reverse discovery? | Direction toggle + USP tagline |
| Gezocht? | Wanted view chip + request listing badges |

---

## 12. Language & consistency

### Removed / aligned (prior phases)
- View axis: Aangeboden / Offered (not Te koop)
- Settlement: Geaccepteerde waarden / Accepted values
- Guest favorites, orders i18n, sitemap gaps

### Remaining drift (non-blocking)
| ID | Severity | Finding |
|----|----------|---------|
| L1 | P2 | Onboarding hints “te koop” wording |
| L2 | P2 | `barterNotAllowedOnMoneyListing` uses “te koop” / “for sale” |
| L3 | P2 | `PublicSellerProfileNew` owner panel hardcoded Dutch |
| L4 | P2 | `PublicDeliveryProfileClient` hardcoded “te koop” |
| L5 | P2 | `StartChatButton` hardcoded Dutch quick-reply |
| L6 | P3 | Unused `AdvancedFiltersPanel.tsx` (dead code) |

---

## 13. Pilot readiness checklist

| Question | Answer |
|----------|--------|
| Understand HomeCheff in &lt;10 seconds? | ✅ Hero definition + USP |
| Understand USP? | ✅ Value exchange in hero + discovery |
| Understand reverse discovery? | ✅ Direction toggle + education copy |
| Understand value exchange? | ✅ Accepted values on detail + filters |
| Understand HomeCheff Checkout? | ✅ Settlement intro + Connect guidance |
| Trust the platform? | ✅ Reviews, Connect, clear settlement |
| Know what to do next? | ✅ Settlement router CTAs |

---

## 14. Architecture compliance

**Frozen SSOT (verified, unchanged):**
- `canonical-model.ts`
- `settlement-options.ts` / `settlement-router.ts`
- Taxonomy resolve + pending proposals
- Reverse discovery session + accepted-values filter
- Tile pipeline (`map-to-tile-model`, `build-tile-settlement-row`)
- `home-filter-persist.ts`
- Normalization proposal (`propose-product-normalization.ts`)

**No parallel implementations introduced in 11A.**

---

## 15. Operations (non-code)

| Item | Severity | Notes |
|------|----------|-------|
| Production DB backfill | P2 ops | 10E scripts ready; requires Neon backup + `CONFIRM_BACKFILL=1` |
| Vercel production env verify | P2 ops | Confirm `DATABASE_URL` before backfill write |
| Monitor feed client filtering | P3 | Sufficient for 100–500 users |

---

## 16. Findings summary

| ID | Severity | Finding | Resolution |
|----|----------|---------|------------|
| B4 / SP1 | P1 | Mobile filter missing Services category | **Fixed 11A** — `DISCOVERY_CATEGORY_CHIP_OPTIONS` |
| G3 | P2 | Onboarding “te koop” bullets | Deferred post-pilot |
| L1–L5 | P2 | Secondary copy / hardcoded NL strings | Deferred post-pilot |
| A1 | P2 | Hover preview `aria-modal` | Deferred post-pilot |
| S3 | P2 | Onboarding services route | Deferred post-pilot |
| — | P2 ops | Production backfill not executed | Ops task, not RC blocker |

**P0 count after 11A fixes: 0**

---

## Conclusion

All Phase 10A P0 items were resolved in 10A. All Phase 10B P2 polish items were resolved in 10B. Phase 10C–10D normalized discovery data and filter persistence. Phase 10E provides production backfill guardrails (write pending ops confirmation).

Phase 11A fixed the last pilot-quality filter parity gap (mobile Services category) without touching architecture.

**HomeCheff Release Candidate RC1 is approved for the first city pilot.**

---

## Validation

```bash
npx tsx scripts/validate-release-candidate-phase11a.ts
npm run lint
npm run build
```
