# Marketplace Value Economy — Phase 8D Audit

Date: 2026-07-08  
Scope: UX completion across all marketplace surfaces (Phases 7A–8C foundation)

## Executive summary

HomeCheff’s **canonical value-economy architecture** (intent / category / settlement axes, taxonomy SSOT, settlement-options helper, reverse discovery) is largely in place. Phase 8D finds **terminology drift**, **lossy `orderMethod` on a few commerce paths**, and **duplicate seller Connect copy** as the main remaining gaps — not missing features.

**Pilot readiness:** A new user can discover by money or counter-value, see settlement on tiles/detail, and propose/chat/checkout — but legacy strings (“Te koop”, “aanbod”) and unwired settlement-router CTAs weaken the “exchange value, not only cash” message.

---

## 1. Complete UX audit by surface

### Homepage & feed

| Surface | Status | Notes |
|---------|--------|-------|
| View chips | ✅ | `marketplace.canonical.view.*` via `DISCOVERY_VIEW_CHIP_OPTIONS` |
| Category chips | ✅ | `DISCOVERY_CATEGORY_CHIP_OPTIONS` |
| Reverse discovery (8C) | ✅ | `DiscoveryDirectionToggle` + offer-mode filter |
| Feed intro copy | ⚠️ → ✅ | `feed.chipSectionIntro` updated to “aangeboden, gezocht” (8D) |
| Gezocht empty CTA | ⚠️ → ✅ | Was `feed.chipSale` (“Te koop”); now `marketplace.canonical.view.offered` |
| Sale empty states | ⚠️ → ✅ | Copy broadened beyond money-only “aanbod” (8D) |
| Settlement on tiles | ✅ | `build-tile-settlement-row.ts` + `resolveSettlementOptions` |
| Favorites tiles | ⚠️ → ✅ | Was hardcoded checkout flags; now `resolveSettlementOptions` (8D) |

### Search & advanced filters

| Surface | Status | Notes |
|---------|--------|-------|
| Text search | ✅ | Client-side memos in GeoFeed |
| Price filter | ✅ | AND-combined with accepted-values OR filter |
| Accepted values filter | ✅ | Taxonomy-only; pending proposals (8C) |
| Settlement as filter | ✅ N/A | By design — settlement is follow-up, not filter axis (7E) |

### Tiles & preview cards

| Surface | Status | Notes |
|---------|--------|-------|
| Universal tile router | ✅ | Phase 7D pipeline |
| Value + settlement row | ✅ | Phase 7B/7C order preserved |
| Preview settlement | ✅ | `MarketplacePreviewCard` + `resolveSettlementOptions` |
| Preview proposal CTA | ⚠️ | Shown by listing kind; not gated on `canMakeProposal` |

### Detail pages

| Surface | Status | Notes |
|---------|--------|-------|
| Settlement section | ✅ | `ProductDetailSettlementSection` |
| Accepted values | ⚠️ → ✅ | Heading now `sellerAcceptsHeading` + description (8D) |
| Settlement booleans on client | ⚠️ → ✅ | `ListingDetailPage` passes `acceptHomeCheffPayment` / `acceptDirectContact` (8D) |
| Commerce CTAs | ⚠️ | `isContactOnlyProduct` now boolean-aware (8D); full `settlement-router` wiring deferred |
| Trust block | ✅ | `ProductDetailTrustBlock` + discovery trust contract |

### Create / edit listing

| Surface | Status | Notes |
|---------|--------|-------|
| Intent + category + taxonomy | ✅ | `MarketplaceOfferForm` |
| Settlement booleans | ✅ | `acceptHomeCheffPayment` / `acceptDirectContact` |
| Accepted values picker | ✅ | Taxonomy + pending proposals |
| Connect guidance | ⚠️ → ✅ | Duplicate `StripeConnectPaymentsBanner` removed; `SettlementConnectGuidance` only (8D) |
| Edit parity | ✅ | Same form for create/edit |

### Proposal flow

| Surface | Status | Notes |
|---------|--------|-------|
| Listing → proposal | ✅ | `StartChatButton` + `CreateProposalSheet` |
| Reverse discovery prefill | ✅ | `reverse-discovery-session` → `requestedValueTaxonomyIds` (8C) |
| Exchange suggestions | ✅ | `proposalPrefillFromSuggestionCard` |
| Settlement mode in form | ✅ | `ProposalFieldsSection` + `AcceptedValuesPicker` |
| Router-based CTA labels | ⚠️ | `settlement-router.ts` documented but not used by all entrypoints |

### Checkout

| Surface | Status | Notes |
|---------|--------|-------|
| API gate | ⚠️ | `app/api/checkout/route.ts` still uses `orderMethod` heuristics |
| Sticky CTA | ⚠️ | Boolean fields passed (8D); Stripe block when Connect missing |
| Cart flow | ✅ | Unchanged |

### Chat, orders, profile, favorites

| Surface | Status | Notes |
|---------|--------|-------|
| Chat / proposal deep-link | ✅ | Session prefill storage |
| Orders | ✅ | Stripe path unchanged |
| Profile listings | ✅ | `map-profile-listing-to-tile-model` uses settlement SSOT |
| Favorites | ⚠️ → ✅ | Settlement flags from `resolveSettlementOptions` (8D) |

### Wanted & services

| Surface | Status | Notes |
|---------|--------|-------|
| Gezocht chip | ✅ | `marketplace.canonical.view.wanted` |
| Services category | ✅ | Category axis, not view chip |
| Request detail | ✅ | Proposal-primary actions via `resolveDetailPageActions` |

---

## 2. Create flow understanding

| Topic | User sees | Source |
|-------|-----------|--------|
| What they create | Intent + category + taxonomy | `MarketplaceOfferForm` |
| Payment methods | Settlement checkboxes | `acceptHomeCheffPayment`, `acceptDirectContact` |
| Alternative values | `AcceptedValuesPicker` + pending form | `acceptedSpecializations` |
| Proposals | Copy in form + barter openness | `barterOpenness`, price model |
| HomeCheff Checkout | `SettlementConnectGuidance` | Connect status fetch |
| Direct contact | Settlement checkbox + copy | `marketplace.settlement.*` |
| Barter / mixed | `barterOpenness` + accepted values | `proposal-settlement` alignment |

**Gap:** Publish toast still uses `marketplace.stripeRecommendation.message` — third Connect copy namespace (low severity).

---

## 3. Edit flow parity

Create and edit share `MarketplaceOfferForm` — **full parity** for settlement booleans, accepted values, barter, fulfillment, taxonomy.

No missing editable fields identified for V2 products.

---

## 4. Detail page communication

Detail plan (`buildDetailUiSectionPlan`) shows sections by listing kind without clutter:

- Description → value exchange → **settlement** → accepted values → conditions → trust

**8D fix:** Accepted values heading = “Deze aanbieder accepteert” with helper description.

Settlement section already explains HomeCheff Checkout, direct contact, barter, accepted values via i18n keys under `marketplace.detail.settlement.*`.

---

## 5. Proposal flow by entry point

| Entry | Prefill source | Continuity |
|-------|----------------|------------|
| Detail commerce zone | Listing + optional reverse session | ✅ |
| Reverse discovery | `reverseDiscoveryOfferIds` | ✅ 8C |
| Wanted / services | `resolveDetailPageActions` proposal-primary | ✅ |
| Exchange suggestion card | `exchangeSuggestion` overlap ids | ✅ |
| Counter proposal | `parentProposal` | ✅ |

**Gap:** Proposal sheet does not show “you selected photography in discovery” banner — values are prefilled silently (acceptable for pilot).

---

## 6. Checkout flow routing

| Path | Route | Dead ends |
|------|-------|-----------|
| HomeCheff Checkout | Cart → checkout API | Blocked when Connect missing — chat fallback shown |
| Direct contact | Start chat | Requires configured channels |
| Proposal | Chat + proposal sheet | Requires chat channel |
| Contact-only listing | Chat primary | ✅ |

**Gap:** Dual-settlement listings (HomeCheff + direct) relied on collapsed `orderMethod` — **partially fixed** via boolean pass-through and `isContactOnlyProduct` update (8D).

---

## 7. Settlement UX

| Element | Status |
|---------|--------|
| Tile icons | ✅ Distinct per method |
| Detail explanations | ✅ `ProductDetailSettlementSection` |
| Preview labels | ✅ `buildPreviewSettlement` |
| Connect “needs setup” | ✅ Seller: `SettlementConnectGuidance`; buyer: `needsConnect` on detail |
| Education tone | ✅ HomeCheff safest; alternatives supported |

**Terminology drift (remaining):**

- NL: “Geaccepteerde tegenwaarden” vs “Alternatieve tegenwaarden” on settlement rows — same concept, two phrases. Recommend unifying in a future copy-only pass.

---

## 8. Connect onboarding

| Location | Behaviour |
|----------|-----------|
| Create/edit form | `SettlementConnectGuidance` — non-blocking, CTA to `/api/stripe/connect/onboard` |
| Publish validation | Toast only — does not block |
| Detail (buyer) | Explains checkout unavailable until seller completes Connect |

**8D:** Removed duplicate `StripeConnectPaymentsBanner` on create form.

---

## 9. Community trust

Trust flows through `DiscoveryTrustContract` → tiles (`TileTrustCue`) → `ProductDetailTrustBlock`.

Reinforces confidence for proposals and checkout; not settlement-specific but supports exchange decisions.

---

## 10. Empty states

| State | 8D change |
|-------|-----------|
| Sale empty | Value-economy copy (not only “aanbod”) |
| Gezocht empty CTA | Canonical “Aangeboden” label |
| Accepted-values empty | Mentions offers **and** requests |
| Reverse-discovery empty | Sibling taxonomy + nearby categories (8C) |

All reuse existing card/button patterns — no new layouts.

---

## 11. Cross-surface terminology

### Canonical (target)

| Concept | Key |
|---------|-----|
| Offered (view) | `marketplace.canonical.view.offered` |
| Wanted | `marketplace.canonical.view.wanted` |
| Accepted values (consumer) | `marketplace.detail.acceptedValues.sellerAcceptsHeading` |
| Settlement | `marketplace.detail.settlement.*` |

### Legacy (deprecate in UI)

| Key | Issue |
|-----|-------|
| `feed.chipSale` | “Te koop” / “For sale” — still in JSON, no longer used in Gezocht empty CTA |
| `feed.saleViewOffer` | Legacy |
| `marketplace.summary.offer` | “Aanbod” vs “Aangeboden” |

---

## 12. Data integrity (canonical sources)

| Domain | SSOT |
|--------|------|
| Category / view | `lib/marketplace/canonical-model.ts` |
| Taxonomy | `lib/marketplace/taxonomy.ts` + `taxonomy-resolve.ts` |
| Accepted values normalize | `taxonomy-normalize.ts` (+ pending ids) |
| Settlement flags | `settlement-options.ts` |
| Settlement routing (future CTAs) | `settlement-router.ts` |
| Reverse discovery | `accepted-values-discovery.ts` |
| Tiles | `map-to-tile-model.ts`, profile/favorite mappers |

**Rule:** Never derive settlement from `orderMethod` alone when booleans exist.

---

## 13. Performance

Phase 8D changes: **copy, boolean pass-through, mapper fixes only** — no new APIs, providers, or remounts.

---

## 14. Future readiness (report only)

| Expansion | Ready? |
|-----------|--------|
| Local currency | Settlement modes extensible |
| Community credits | Pending-value id pattern reusable |
| Time banking / skill exchange | Taxonomy + VALUE_ONLY proposals |
| Taxonomy approval workflow | `PendingAcceptedValueProposal.approvedTaxonomyId` (8C) |

---

## Phase 8D fixes applied

1. Detail accepted-values heading + description  
2. Listing detail boolean pass-through  
3. `isContactOnlyProduct` boolean-aware  
4. Favorites tile settlement via `resolveSettlementOptions`  
5. Single Connect guidance on create form  
6. Feed empty-state terminology alignment  
7. i18n value-economy copy updates (NL + EN)

## Deferred (documented, not blocking pilot)

- Wire all commerce CTAs through `settlement-router.ts`  
- Checkout API boolean-aware gate  
- Unify all “accepted values” NL synonyms  
- Deprecate unused `feed.chipSale` keys  
- Remove orphan `ProductAcceptedBadgesSection.tsx`  
- Session-persist discovery direction + accepted values
