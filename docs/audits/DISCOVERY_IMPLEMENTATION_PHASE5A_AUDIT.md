# Discovery Implementation Audit — UX-FIN Phase 5A (Codebase-First)

**Date:** 2026-07-08
**Method:** Code is the single source of truth. Prior audits (Phase 5) used only as reference. Every capability below was verified against `prisma/schema.prisma`, `app/api/*`, `app/*` routes and `components/*`.
**Constraints honored:** no new marketplace functionality, no business-logic/ranking/economy/backend changes, all Phase 4/4B/4C performance architecture preserved.

---

## 1. Full functional inventory (what actually exists in code)

Legend — **EXISTS** = implemented and user-facing · **PARTIAL** = real but hidden/backend-only/no dedicated hub · **ABSENT** = not in code.

### Marketplace / verticals
| Capability | Status | Evidence |
|---|---|---|
| Producten | EXISTS | `Product` (`schema.prisma:397`), feed `sale` chip, `ListingKind.PRODUCT` |
| Maaltijden / HomeCheff | EXISTS | `ProductCategory.CHEFF`, `Dish` category CHEFF, vertical slug `cheff` |
| Tuin / HomeGarden | EXISTS | enum **`GROWN`** + `MarketplaceCategory.GROW`, slug `garden/tuin` |
| Creaties / HomeDesigner | EXISTS | `ProductCategory.DESIGNER` + `MarketplaceCategory.DESIGN` |
| Inspiratie | EXISTS | derived `INSPIRATION` kind, published `Dish`/`WorkspaceContent`, `/api/inspiratie`, feed `inspiration` chip |
| Gezocht (requests) | EXISTS | `ListingIntent.REQUEST`, feed `gezocht` chip, create flow "Ik zoek iets", tile `request` badge |
| Community listings | ABSENT (as a listing type) | "community" = `CommunityOrder` deals derived from `Proposal`→`Agreement`, not a feed listing |

There is **no `ListingType` enum** — listing kind is runtime-derived (`lib/marketplace/listing-kind/derive-listing-kind.ts`). Verticals map to `CHEFF/GROWN/DESIGNER`; sale-vs-request to `ListingIntent`.

### Economy
| Capability | Status | Evidence |
|---|---|---|
| Kopen / checkout | EXISTS | `app/checkout/*`, `app/api/checkout/route.ts`, `Order`/`OrderItem` |
| Verkopen / seller dashboard | EXISTS | `app/verkoper/*`, `MarketplaceOfferForm.tsx`, `SellerProfile` |
| Voorstellen / bod | EXISTS | `Proposal` (`:741`), `lib/proposals/proposal-service.ts` |
| Onderhandelen | EXISTS | `counterProposal`, `CounterProposalForm.tsx`, `COUNTERED` status |
| Ruilen (barter) | PARTIAL | `BarterOpenness` config + `BarterOpennessSelector` (rendered in offer form), chat `SettlementMode` VALUE_ONLY/FREE. **Automated matching = future** (`FUTURE_EXCHANGE_CAPABILITIES`) |
| Accepted values | EXISTS/PARTIAL | `acceptedSpecializations`, `value-exchange/*`, `TileValueRow.tsx` shown on tiles/detail |
| Alternatieve betaalmethoden | EXISTS | `ProductOrderMethod{HOMECHEFF_PAYMENT,CONTACT}`, `PriceModel` incl. `VOLUNTARY/ON_REQUEST` |
| Community economy (deals) | EXISTS | `Proposal→Agreement→CommunityOrder→DealReview`, `app/profile/deals` |
| Bezorging / courier | EXISTS | `DeliveryOrder` + `DeliveryRequest`/`CourierAssignment`, `app/delivery/*` |
| Afspraken / ophalen | EXISTS | Proposal `requestedDate`/`requestedTimeWindow`, `ProposalFulfillmentType{PICKUP,DELIVERY}` |
| Reviews | EXISTS | `ProductReview`/`DishReview`/`DealReview`/`DeliveryReview` |
| Props | EXISTS | `WorkspaceContentProp`, `PropsButton.tsx`, `api/props/toggle` |
| Fans / follows | EXISTS | `Follow`/`FanRequest`, `FansAndFollowsList.tsx` |
| Vertrouwen / badges | EXISTS | `derive-trust-tier.ts`, `Badge`/`UserBadge`, HCP |

### Diensten
| Capability | Status | Evidence |
|---|---|---|
| Diensten (services) | EXISTS (creatable) / PARTIAL (no hub) | listing kinds `SERVICE/WORKSHOP/COACHING`, `MarketplaceCategory.ARTISTIC_SERVICE/KNOWLEDGE`; creatable via entry flow; **no top-level "Diensten" nav** |
| Klussen | EXISTS (creatable) / PARTIAL | `PRACTICAL_SERVICE`→`ListingKind.TASK`; surfaced via opportunity cards → Gezocht feed |
| Buurthulp / lokale hulp | PARTIAL | `community-helper-variants.ts` cards routing to `/?chip=gezocht#homecheff-feed`; no dedicated entity/route |
| Community services | PARTIAL | real backend loop (`CommunityOrder`), no dedicated catalog |

### Community
| Capability | Status |
|---|---|
| Profiel, fans, props, reviews, afspraken, reputation, badges, courier/operations | EXISTS (see economy table) |
| Community hub / activity | EXISTS (`CommunityPulseBar`, `app/profile/deals`, activity surfaces) |

### Discovery surfaces
| Surface | Status | File |
|---|---|---|
| Hero (desktop full, mobile compact) | EXISTS | `HomeHeroSection.tsx` |
| Chips (all/te koop/inspiratie/gezocht) | EXISTS | `GeoFeed.tsx` |
| Filters (scope, place/GPS, radius, q, category, sort, refine, price) | EXISTS | `GeoFeed.tsx` / `FeedFiltersPanel` |
| Cards (sale / request / inspiration variants) | EXISTS | `MarketplaceTileRouter` + `build-tile-badges.ts` |
| Detail / preview / chat / proposal / afspraken | EXISTS | product detail + chat proposal flow |
| Community widgets / sidebar | EXISTS (login-gated modules) | `HomeDesktopSidebar.tsx` |
| Onboarding | EXISTS | `OnboardingTour`, `PostAuthPersonaBanner` |
| Mobile / desktop split | EXISTS | `HomePageClient.tsx` (single GeoFeed per resolved viewport) |

---

## 2. Gap analysis (what was under-communicated vs. reality)

| Gap | Severity | Reality in code |
|---|---|---|
| Guest copy said services/help/klussen/ruilen are **"binnenkort/coming soon"** | High | These EXIST now: `SERVICE/TASK` creatable, `REQUEST` (Gezocht) feed live, barter-openness selectable, non-money settlement in chat |
| Gezocht absent from hero ecosystem chips | High | `ListingIntent.REQUEST` + `gezocht` chip are live |
| `ctaShare` = "Deel wat je maakt" reads as social share, not sell/earn | High | Selling + HomeCheff payments are core, live |
| Sidebar "Uitgelicht / Binnenkort" permanent placeholder (aria-hidden) | Medium | A real Gezocht/help surface already exists to point to |
| Guest reputation row titled "Jouw reputatie" | Medium | Guest has no reputation; card should invite discovery of trust |
| Dual search fields (`q` + refine `searchQuery`) | Medium | Both real; refine narrows within results — was under-labeled |
| Community/trust (afspraken, reviews, props) barely named on homepage | Medium | All EXIST; community card copy was generic |

Note: **barter automated matching does not exist** — copy must say "geef aan dat je open staat voor ruilen" (config + chat), never promise a swap engine.

---

## 3. Implemented in Phase 5A (safe, copy-first, zero perf risk)

| # | Area | Change | Files |
|---|---|---|---|
| 1 | Hero (5A.1) | Subtitle rewritten to name real verbs: ontdek/koop/verkoop/ruil + oproep (Gezocht) + inspiratie + hulp | `nl.json`/`en.json` `homePhase1.heroSubtitle` |
| 2 | Ecosystem (5A.2) | Added **Gezocht** hero chip (🙋); barter chip label "Ruilhandel"→"Ruilen" (honest) | `HomeHeroSection.tsx`, i18n `heroChipRequests` |
| 3 | Capabilities (5A.3) | Guest bottom-nav bullets rewritten present-tense (services, Gezocht, barter-openness) — removed "binnenkort/straks/coming soon" | i18n `guestBottomNav.earn/create` |
| 4 | CTA (5A.4) | `ctaShare` "Deel wat je maakt"→"Verkoop of deel" / "Sell or share" | i18n `homePhase1.ctaShare` |
| 5 | Hierarchy + Community (5A.5/5A.8) | Sidebar "coming soon" placeholder → live **Gezocht** card (link `/?chip=gezocht#homecheff-feed`) with CTA | `HomeDesktopSidebar.tsx`, i18n `homeDorpsplein.spotlight*` |
| 6 | Community (5A.8) | Community card copy now names afspraken, reviews, props, verkopen/ruilen | i18n `homeDorpsplein.communityCardBody` |
| 7 | Community (5A.8) | Guest reputation row → `guestTitle`/`guestCta` ("Vertrouwen in de buurt"/"Ontdek") | `HomeReputationCompactCard.tsx`, i18n |
| 8 | Filters (5A.7) | Refine label clarified to "Verfijn deze resultaten …" to disambiguate from global search | i18n `feed.refineSectionLabel` |

All changes are i18n + presentational. No fetch, no state, no ranking, no schema, no density/SWR/cache touched.

---

## 4. Deliberately NOT changed (with rationale)

- **Feed card layout (5A.6):** tiles already differentiate sale (price + value/barter row), request (amber 🙋 "Gezocht"), inspiration (lightbulb). Distinction is code-solid; user asked "geen redesign". No change.
- **Dual-search consolidation / unified filter surface (5A.7):** merging `q` + refine `searchQuery` is a larger refactor in a 2600-line `GeoFeed` with performance guards; carries regression risk. Deferred; documented as larger item. Only the safe label quick win shipped.
- **Mobile hero chips (5A.9):** mobile hero is intentionally compact (feed-first, Phase 4 UX). Message parity achieved via the shared, rewritten `heroSubtitle` rather than adding height.
- **Services hub / Buurthulp route (Diensten):** would be new functionality — out of scope.

---

## 5. Discovery flow (5A.10) — verified coherent

Homepage → Feed (chips/filters preserved) → Preview/Detail → Chat → Voorstel (`Proposal`) → Afspraken (`requestedDate`/fulfillment) → Afronden (`CommunityOrder`/`DealReview`) → Verder ontdekken (instant back via Phase 4 return cache + scroll restore). Every step maps to a real model/route. The only prior friction — guests not discovering Gezocht/sell before leaving — is addressed by the hero chip, subtitle, CTA copy and the repurposed sidebar Gezocht surface.

---

## 6. Performance (5A.11) — preserved

No extra renders/fetches/remounts introduced (edits are copy + one static `<div>`→`<Link>` swap and one array entry). Verified by validator:
- density external store, desktop default 2 / mobile 1, density switch never refetches
- homepage return cache + unified 4C SWR cache intact
- no debug logging reintroduced
- all Phase 4/4B/4C guard scripts present

---

## 7. Validation

```
npx tsx scripts/validate-discovery-phase5a.ts        # 32/32
npx tsx scripts/validate-discovery-experience.ts     # 23/23 (Phase 5 regression)
npx tsx scripts/validate-runtime-performance-phase4c.ts   # 4C regression
npm run build                                        # pass
```

---

## 8. Remaining larger improvements (deferred, out of Phase 5A scope)

- Unified filter surface + single search field (merge `q`/`searchQuery`, one global reset).
- Optional dedicated **Diensten / Buurthulp** discovery entry (would be new functionality — needs product decision).
- Guest-visible community proof module (deals/reviews) beyond login-gated sidebar.
- Promote verticals (Cheff/Garden/Designer) to feed chips alongside mode chips.
- i18n deprecation of the stale `home.*` legacy homepage block.
