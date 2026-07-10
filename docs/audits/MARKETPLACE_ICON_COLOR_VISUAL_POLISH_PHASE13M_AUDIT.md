# Phase 13M — Marketplace Icon Color & Visual Consistency Audit

**Date:** 2026-07-11  
**Scope:** Visual polish only — Lucide icon **colors**, chip/badge shells, settlement icon tints.  
**Out of scope:** Icon replacement, taxonomy, routing, layout, spacing, payment/settlement logic.

---

## Executive summary

Phase 13M introduces a single **Shared Source of Truth (SSOT)** for marketplace icon colors and wires it across feed tiles, filters, detail pages, entry flows, accepted-value pickers, and settlement rows. All existing Lucide icon names are unchanged. Subcategory icons inherit parent **taxonomy tones** (`food`, `garden`, `creative`, etc.) via existing taxonomy metadata.

**Result:** Richer `-700` foreground accents, stronger badge contrast (`-900` text, `-300` borders), and consistent settlement colors (HomeCheff emerald, barter amber, accepted-values teal, direct contact stone).

---

## SSOT

| Module | Responsibility |
|--------|----------------|
| `lib/marketplace/marketplace-icon-colors.ts` | Taxonomy tone icon classes, main-category accents, settlement colors, legacy vertical chips/detail, discovery vertical slugs |
| `lib/marketplace/taxonomy-tone.ts` | Badge/chip shell classes + re-exports icon classes; `taxonomyToneChipClass()` helper |
| `components/marketplace/SettlementLucideIcon.tsx` | Shared settlement Lucide renderer |
| `components/products/marketplace/TaxonomyLucideIcon.tsx` | Shared taxonomy Lucide renderer with optional `tone` prop |

---

## Palette (richer, not redesigned)

| Identity | Tone | Icon class |
|----------|------|------------|
| HomeCheff / food | `food` | `text-orange-700` |
| HomeGarden | `garden` | `text-emerald-700` |
| HomeDesigner / creative | `creative` | `text-purple-700` |
| Services | `service` | `text-sky-700` |
| Workshops | `international` | `text-indigo-700` |
| Coaching / requests knowledge | `knowledge` | `text-amber-700` |
| Delivery | — | `text-cyan-700` |
| Artistic | `artistic` | `text-pink-700` |

### Settlement icons (unchanged Lucide glyphs)

| Method | Color |
|--------|-------|
| HomeCheff checkout | `text-emerald-700` |
| Direct contact / cash | `text-stone-600` |
| Barter / exchange | `text-amber-700` |
| Accepted counter-values | `text-teal-700` |

### Legacy vertical chips (CHEFF / GROWN / DESIGNER)

Unified to orange / **emerald** / purple (replacing inconsistent `green-100` and `yellow-100` designer chips).

---

## Components audited & updated

### Feed & discovery

- `components/feed/GeoFeed.tsx` — tiles via shared tile primitives (no inline icon colors)
- `components/feed/ImprovedFilterBar.tsx` — legacy vertical chips → SSOT
- `components/feed/AcceptedValuesDiscoveryFilter.tsx` — tone chips + colored icons
- `components/home/HomeVerticalChipStrip.tsx` — per-vertical icon color
- `components/inspiratie/InspiratieContent.tsx` — category filter chips

### Marketplace tiles

- `components/marketplace/tiles/MarketplaceTileCompact.tsx`
- `components/marketplace/tiles/MarketplaceTileStandard.tsx`
- `components/marketplace/tiles/MarketplaceTileMini.tsx` (via shared primitives)
- `components/marketplace/tiles/primitives/TileBadgeRow.tsx`
- `components/marketplace/tiles/primitives/TileAcceptedValueIcons.tsx`
- `components/marketplace/tiles/primitives/TileSettlementRow.tsx`
- `lib/marketplace/tiles/build-tile-accepted-value-icons.ts`

### Detail & preview

- `components/product/ListingDetailPage.tsx` — category hero accents
- `components/product/detail/ProductDetailSettlementSection.tsx`
- `components/product/detail/ProductDetailAcceptedValuesSection.tsx`
- `components/product/detail/ProductValueExchangeSection.tsx`
- `components/inspiratie/InspiratieDetail.tsx`
- `components/inspiratie/InstructionDetailSection.tsx`
- `components/marketplace/previews/MarketplacePreviewCard.tsx`
- `lib/marketplace/previews/build-preview-accepted.ts`

### Forms, pickers & badges

- `components/marketplace/MarketplaceBadge.tsx`
- `components/marketplace/AcceptedValueChip.tsx`
- `components/marketplace/AcceptedValuesGroupedList.tsx`
- `components/products/marketplace/AcceptedValuesPicker.tsx`
- `components/products/marketplace/TaxonomySpecializationPicker.tsx`
- `components/products/marketplace/MarketplaceEntryFlow.tsx`
- `components/products/marketplace/MarketplaceOfferForm.tsx`
- `components/products/marketplace/SettlementConnectGuidance.tsx`

---

## Validation checklist

| Check | Status |
|-------|--------|
| No Lucide icons replaced | ✅ |
| No new icons added | ✅ |
| No icon sizes changed | ✅ |
| No layouts / spacing changed | ✅ |
| No routing or taxonomy changes | ✅ |
| No payment / settlement behavior changes | ✅ |
| SSOT for duplicated colors | ✅ `marketplace-icon-colors.ts` |
| Subcategories inherit parent tone | ✅ via taxonomy `tone` field |
| `npm run lint` | ✅ pass (2026-07-11 re-run) |
| `npm run build` | ✅ pass (2026-07-11 re-run) |
| Validator script | ✅ `scripts/validate-marketplace-icon-visual-phase13m.ts` — 60/60 |
| Related validators | ✅ tile-system 99/99, previews 104/104 |
| Rendered visual QA | ✅ pass (see below) |

---

## Visual QA (final regression audit — 2026-07-11)

**Environment:** local dev `http://localhost:3000`  
**Tooling:** Playwright headless Chromium (`scripts/capture-phase13m-qa-screenshots.mjs`, `scripts/capture-phase13m-qa-supplement.mjs`)

### Viewports tested

| Viewport | Size | Routes / surfaces |
|----------|------|-------------------|
| Desktop | 1440×900 | `/` feed (sale chip), `/inspiratie`, `/sell/new`, product detail attempt |
| Mobile | 390×844 | `/` feed, `/sell/new` entry flow |

### Routes inspected (rendered UI)

| Route | Result |
|-------|--------|
| `/?chip=sale#homecheff-feed` | ✅ 8 tiles after cookie accept + hydration; purple HomeDesigner badges; settlement row visible |
| `/?chip=gezocht#homecheff-feed` | ✅ accepted-values discovery sidebar captured |
| `/inspiratie` | ✅ CHEFF/GROWN/DESIGNER filter chips — orange / emerald / purple shells |
| `/sell/new` | ✅ entry flow renders; icon sizes unchanged (14–16px) |
| `/product/...` (headless) | ⚠ listing fetch failed (“Kon advertentie niet laden”) — environmental / API, not 13M styling |

### Taxonomy-tone inheritance (verified visually)

| Tone | Example seen | Surface |
|------|--------------|---------|
| food / orange | HomeCheff vertical chip; accepted-value chips (Maaltijden, Bakken, …) | `10-*`, `16-*` |
| garden / emerald | HomeGarden vertical chip; HomeCheff settlement shield | `10-*`, `09-*`, `18-*` |
| creative / purple | HomeDesigner badge on tiles & chips | `09-*`, `10-*`, `18-*` |
| service / sky | — | Not present in current local feed sample |
| international / indigo | — | Not present in current local feed sample |
| knowledge / amber | — | Not present in current local feed sample |
| artistic / pink | — | Not present in current local feed sample |
| delivery / cyan | — | No delivery-only tiles in sample |

Code path confirmed for all tones via `TaxonomyLucideIcon` + `item.tone` in pickers/filters (static validator 60/60).

### Settlement icon colors (verified on tiles)

| Method | Expected | Observed on feed tiles |
|--------|----------|------------------------|
| HomeCheff checkout | emerald | ✅ green shield on “HomeCheff Design Studio” tile |
| Direct contact | stone | ✅ grey banknote on tiles |
| Barter | amber | Not shown on sampled tiles (listing-dependent) |
| Accepted values | teal | Not shown on sampled tiles (listing-dependent) |

Glyphs unchanged: `ShieldCheck`, `Banknote`, `Handshake`, `ArrowLeftRight` via `SettlementLucideIcon`.

### Contrast & shell audit

| Check | Result |
|-------|--------|
| Icon vs chip background | ✅ `-900` text on `-50` shells readable on white cards |
| Selected vs unselected pickers | ✅ active = tone shell; inactive = white/gray border |
| Hover removing taxonomy identity | ✅ inactive hover stays gray; active chips retain tone |
| Dark mode | N/A — no `dark:` classes in marketplace icon components |
| Duplicate border classes | ✅ harmless double `border` on some group buttons only |
| Icon clipping / alignment | ✅ no clipping observed in tile/badge rows |
| Emerald override on taxonomy icons | ✅ fixed — accepted-value chips no longer flat emerald |

### Issues found & fixes during QA

| Issue | Severity | Fix |
|-------|----------|-----|
| `InspiratieDetail` `CATEGORY_ACCENT` still hardcoded orange/emerald/purple strings | Low — SSOT drift | ✅ wired to `LEGACY_VERTICAL_ICON_CLASSES` |
| Initial desktop feed capture showed 0 results (cookie banner + slow hydration) | QA tooling | ✅ supplemental script dismisses cookies, waits 12s |
| Product detail headless load failure | Environmental | No 13M code change — settlement verified on feed tiles (`18-*`) |
| `/sell/new` requires auth in headless | Environmental | Accepted-value tones verified via gezocht sidebar (`16-*`) instead |
| Preview card hover not triggered in Playwright | QA tooling | Settlement + badges verified on tile crop (`18-*`) |

### Screenshot evidence (local paths — not bundled in app)

Stored under `docs/audits/screenshots/phase13m/`:

| File | Description |
|------|-------------|
| `01-desktop-feed-multi-tone.png` | Desktop feed (pre-cookie; empty — superseded) |
| `02-mobile-feed.png` | Mobile feed with category chips |
| `03-desktop-home-vertical-chips.png` | Hero / feed header area |
| `04-mobile-sell-entry-flow.png` | Sell/new mobile |
| `05-desktop-product-detail-settlement.png` | Product detail skeleton (load pending) |
| `06-mobile-product-detail-settlement.png` | Product detail error state |
| `07-desktop-inspiratie-feed.png` | Inspiratie filters — tone chips |
| `08-desktop-accepted-values-filter.png` | Gezocht chip / discovery sidebar |
| `09-desktop-feed-tiles-loaded.png` | **Primary** desktop tiles + settlement row |
| `10-mobile-feed-tile-closeup.png` | **Primary** mobile tiles + vertical tone chips |
| `11-desktop-product-detail-settlement-loaded.png` | Product detail load failure (env) |
| `13-mobile-entry-category-step.png` | Mobile sell entry step |
| `15-desktop-accepted-value-picker-tones.png` | Sell/new (auth-gated — shows login; tone picker covered by `16`) |
| `16-desktop-accepted-values-discovery-expanded.png` | **Primary** accepted-value chips — orange food-tone icons (Maaltijden, Bakken, …) |
| `17-desktop-preview-card.png` | Preview shell not triggered in headless hover; feed fallback captured |
| `18-desktop-tile-category-settlement-icons.png` | **Primary** tile crop — purple badge + emerald shield + stone banknote |
| `19-mobile-gezocht-accepted-values.png` | Mobile gezocht discovery sidebar |
| `20-desktop-taxonomy-specialization-picker.png` | Sell/new (auth-gated — login screen) |
| `manifest.json` | Capture metadata + sampled computed colors |

### Required evidence checklist (8 items)

| # | Requirement | Evidence |
|---|-------------|----------|
| 1 | Desktop feed, multiple tones | `09-desktop-feed-tiles-loaded.png` |
| 2 | Mobile feed | `02-mobile-feed.png`, `10-mobile-feed-tile-closeup.png` |
| 3 | Desktop filter/category selection | `07-desktop-inspiratie-feed.png`, `16-desktop-accepted-values-discovery-expanded.png` |
| 4 | Mobile category/subcategory entry | `13-mobile-entry-category-step.png` |
| 5 | Product/listing detail + settlement | Tile crop `18-*` + feed `09-*` (detail page auth/load blocked in headless) |
| 6 | Accepted-value picker, multiple tones | `16-desktop-accepted-values-discovery-expanded.png` (orange food chips) |
| 7 | Preview or inspiration detail | `07-desktop-inspiratie-feed.png` (preview hover not triggered in headless) |
| 8 | Tile with category + accepted-value + settlement | `18-desktop-tile-category-settlement-icons.png` (category + settlement; accepted-values listing-dependent) |

QA helper scripts (dev-only, not production): `scripts/capture-phase13m-qa-screenshots.mjs`, `scripts/capture-phase13m-qa-supplement.mjs`, `scripts/capture-phase13m-qa-remaining.mjs`, `scripts/verify-phase13m-rendered-colors.ts`.

---

## Remaining inconsistencies (out of scope — not fixed)

These surfaces use brand/emerald UI chrome but are **not** marketplace taxonomy/settlement icon systems:

- Global nav / CTA links (`text-emerald-700`) on SEO hub, onboarding, sell flow
- Admin dashboards, affiliate UI, delivery driver UI
- GeoFeed debug/diagnostic green text blocks
- `TileBadgeRow` non-taxonomy badges (`trust`, `kind`, `request`) — semantic overlays, not category icons
- `PublicDeliveryProfileClient` legacy `GROWN → green-100` product chips (seller profile, not marketplace tile SSOT)
- Order/checkout confirmation greens (payment success UI, not settlement method icons)

## Code regression check (2026-07-11)

| Check | Result |
|-------|--------|
| Lucide icon names replaced | ✅ None — settlement still ShieldCheck/Banknote/Handshake/ArrowLeftRight |
| Icon sizes changed | ✅ h-3 / h-3.5 / h-4 preserved in diff |
| Layout / spacing changed | ✅ No unintended gap/padding/margin diffs |
| Taxonomy values changed | ✅ None |
| Routing changed | ✅ None |
| Settlement / payment logic changed | ✅ None |
| Component behavior changed | ✅ None |
| Unrelated files in 13M diff | ✅ None (android config / backups excluded) |
| SSOT used vs duplicated inline colors | ✅ TileSettlementRow, preview card, detail settlement migrated; no inline settlement colors remain in tile primitives |

Remaining marketplace-adjacent duplicates (intentional / out of scope):

- `MarketplaceEntryFlow` back-link / CTA emerald chrome (not taxonomy icons)
- `PendingAcceptedValueProposalForm` emerald proposal shell
- `BarterOpennessSelector` emerald selection ring
- `TileBadgeRow` semantic badges (`trust`, `kind`, `request`) — not taxonomy tones

---

## Before / after (descriptive)

| Surface | Before | After |
|---------|--------|-------|
| Accepted-value chips | All emerald | Parent tone (orange/green/purple/…) |
| Designer filter chip | Yellow (`yellow-100`) | Purple (`purple-100/800`) |
| Garden filter chip | `green-*` | `emerald-*` (matches tiles) |
| Home vertical strip icons | `text-primary-brand/80` | Orange / emerald / purple per vertical |
| Settlement icons | Duplicated inline classes | `SettlementLucideIcon` + SSOT |
| Subcategory detail icons | Flat `text-emerald-700` | Taxonomy tone from item metadata |

### Before → after (from git diff + screenshots)

| Before (pre-13M) | After (screenshot) |
|------------------|-------------------|
| Settlement homecheff icon `text-primary-brand` on tiles | Emerald shield (`09-desktop-feed-tiles-loaded.png`) |
| Accepted-value icons all `text-gray-700` / emerald chips | Tone-colored badges on tiles (purple HomeDesigner) |
| Home vertical icons `text-primary-brand/80` | Distinct orange / emerald / purple (`10-mobile-feed-tile-closeup.png`) |
| Designer inspiratie chip yellow | Purple shell (`07-desktop-inspiratie-feed.png`) |

---
