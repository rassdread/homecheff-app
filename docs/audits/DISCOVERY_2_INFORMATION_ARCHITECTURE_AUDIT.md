# Discovery 2.0 — Information Architecture, Navigation & Ecosystem Alignment Audit

**Phase:** UX-FIN 5B
**Date:** 2026-07-08
**Method:** Codebase-first. Verified against `prisma/schema.prisma`, `app/api/*`, `app/*` routes, and `components/*`. Prior docs used only as reference. No feature invented; nothing advertised that is not implemented.
**Type:** Audit + prioritized roadmap. Per instructions, **filters are audited only (not implemented)**. Constraints honored: no backend/API/ranking/marketplace-logic change, no functionality removed, all Phase 4/4B/4C performance architecture preserved.

---

## Executive summary

HomeCheff is, in code, a **full local community commerce platform** — buy, sell, request (Gezocht), services (SERVICE/TASK/WORKSHOP/COACHING), value exchange / barter-openness, negotiation (proposals + counters), community deals (Agreement→CommunityOrder→DealReview), delivery/courier, reviews, fans/follows, trust tiers, badges and reputation/HCP. **The runtime and data model already support all of this.**

The gap is **information architecture**: discovery, navigation and community proof do not represent that breadth. Specifically:

1. **Discovery is feed-only.** The single browsing entry point is the homepage feed with 4 view chips (`all / sale / inspiration / gezocht`) + a 3-vertical `<select>`. Services have no discovery pillar; verticals are a dropdown, not first-class.
2. **Navigation is task-thin and duplicated.** Bottom nav = 5 slots (Discover, Create, Messages, HCP, Profile). Deals/agreements, Gezocht, services, reviews, fans, trust have **no nav entry**; several actions (Create, Messages, HCP, Deals, Profile) are duplicated across 4–6 surfaces.
3. **Community/trust proof is buried.** Homepage shows only tile trust cues + `CommunityPulseBar` + reputation card. Props-giving UI is **orphaned/broken**; deal & delivery reviews, per-channel trust, fans/follows and the deals hub are login-gated or 2+ taps deep.

This audit maps everything and gives a prioritized, non-destructive IA roadmap.

---

## 5B.1 — Complete ecosystem audit (verified inventory + pillars)

Legend — **EXISTS** = user-facing · **PARTIAL** = real but hidden/backend-only/no hub · **ABSENT**.

### Pillar A — Marketplace verticals (Core)
| Capability | Status | Code |
|---|---|---|
| HomeCheff (maaltijden) | EXISTS | `ProductCategory.CHEFF`, `Dish` CHEFF, slug `cheff` |
| HomeGarden (tuin) | EXISTS | enum **`GROWN`** + `MarketplaceCategory.GROW`, slug `garden/tuin` |
| HomeDesigner (creaties) | EXISTS | `ProductCategory.DESIGNER` + `MarketplaceCategory.DESIGN` |
| Producten (algemeen) | EXISTS | `Product` (`schema.prisma:397`), `ListingKind.PRODUCT` |

### Pillar B — Intent types (Core)
| Capability | Status | Code |
|---|---|---|
| Te koop (offer) | EXISTS | `ListingIntent.OFFER`, feed chip `sale`, `isMarketplaceSaleItem` |
| Gezocht (request) | EXISTS | `ListingIntent.REQUEST`, feed chip `gezocht`, create "Ik zoek iets" |
| Inspiratie | EXISTS | derived `INSPIRATION`, `Dish` PUBLISHED, `/api/inspiratie`, chip `inspiration` |

### Pillar C — Diensten (Secondary; creatable, no discovery hub)
| Capability | Status | Code |
|---|---|---|
| Diensten (SERVICE) | PARTIAL | listing kind `SERVICE`, `MarketplaceCategory.ARTISTIC_SERVICE` — creatable, no hub |
| Klussen (TASK) | PARTIAL | `PRACTICAL_SERVICE`→`ListingKind.TASK`, opportunity cards → Gezocht feed |
| Workshops (WORKSHOP) | PARTIAL | `KNOWLEDGE`→`WORKSHOP` (tile shows date) |
| Coaching (COACHING) | PARTIAL | `KNOWLEDGE`→`COACHING` |

### Pillar D — Value exchange & negotiation (Secondary/Advanced)
| Capability | Status | Code |
|---|---|---|
| Voorstellen (proposals) | EXISTS | `Proposal`, `proposal-service.ts` |
| Onderhandelen (counters) | EXISTS | `counterProposal`, `CounterProposalForm.tsx` |
| Accepted values | EXISTS/PARTIAL | `acceptedSpecializations`, `TileValueRow.tsx`, `ProductValueExchangeSection.tsx` |
| Ruilen (barter) | PARTIAL | `BarterOpenness` config + `BarterOpennessSelector`, chat `SettlementMode` VALUE_ONLY/FREE. **Automated matching = future** |
| Alt. betaalmethoden | EXISTS | `ProductOrderMethod{HOMECHEFF_PAYMENT,CONTACT}`, `PriceModel` incl. `VOLUNTARY/ON_REQUEST` |

### Pillar E — Fulfilment (Core/Secondary)
| Capability | Status | Code |
|---|---|---|
| Kopen / checkout | EXISTS | `app/checkout/*`, `Order`/`OrderItem` |
| Verkopen | EXISTS | `app/verkoper/*`, `MarketplaceOfferForm.tsx`, `SellerProfile` |
| Bezorging / courier | EXISTS | `DeliveryOrder` + `DeliveryRequest`/`CourierAssignment`, `app/delivery/*`, `app/bezorger/*` |
| Afspraken / ophalen | EXISTS | Proposal `requestedDate`/`requestedTimeWindow`, `ProposalFulfillmentType` |
| Community Deals | EXISTS | `Proposal→Agreement→CommunityOrder→DealReview`, `app/profile/deals` |

### Pillar F — Community & trust (Secondary; under-surfaced)
| Capability | Status | Code |
|---|---|---|
| Reviews | EXISTS | `ProductReview`/`DishReview`/`DealReview`/`DeliveryReview` |
| Props | PARTIAL (**give-UI orphaned**) | `WorkspaceContentProp`, counts shown; `PropsButton.tsx` not rendered anywhere |
| Fans / follows | EXISTS (profile-only) | `Follow`/`FanRequest`, `FansAndFollowsList.tsx` |
| Vertrouwen (trust tiers) | EXISTS | `derive-trust-tier.ts`, tile cues, `ProfileTrustSummaryBlock.tsx` |
| Badges | EXISTS | `Badge`/`UserBadge`, `UserBadgeChips.tsx` |
| Reputation / HCP | EXISTS | `app/mijn-hcp` (login), `app/hcp-ranglijsten` (public, no link), `HomeReputationCompactCard` |
| Community activity (pulse) | EXISTS (guest-visible) | `CommunityPulseBar` ← `/api/home/community-pulse` |

**Not a listing type:** "Community listings" = `CommunityOrder` deals, not a feed entity — **ABSENT** as a discoverable listing.

**Pillar classification for IA:**
- **Core (must be obvious in <5s):** verticals (Cheff/Garden/Designer), Te koop, Gezocht, Inspiratie, Kopen/Verkopen, local/nearby.
- **Secondary (one tap away):** Diensten, Bezorging, Community deals/Afspraken, Reviews/Trust, Fans.
- **Advanced (contextual, in-flow):** Voorstellen/Onderhandelen, Ruilen/accepted values, Props, Badges/HCP leaderboards.

---

## 5B.2 — Homepage information architecture

**Structure (`components/home/HomePageClient.tsx`):** one `GeoFeed` per resolved viewport (Phase 4 guard).
- Desktop: 3-col `[280px filters | feed | 320px sidebar]` inside the composed GeoFeed layout.
- Mobile: compact hero → (logged-in) `UserActionCenter` → feed. No sidebar.

**Hero (`HomeHeroSection.tsx`, post-5A):** live label, title, subtitle (ontdek/koop/verkoop/ruil/oproep/inspiratie/hulp), 8 ecosystem chips incl. Gezocht (desktop `sm:` only), orbit + platform strip (desktop), 2 CTAs (Discover / "Verkoop of deel").

**Sidebar (`HomeDesktopSidebar.tsx`, post-5A):** welcome, UserActionCenter, role quick links, reputation card, CommunityPulseBar, surface stack, promotions, quick actions (Create / Messages / Makers-nearby), creator/return/profile-progress cards, community card, **live Gezocht card** (was placeholder).

### 5-second comprehension test
| Question | Guest | Logged-in |
|---|---|---|
| What is HomeCheff? | ✅ hero title/subtitle | ✅ |
| What can I do? | ⚠️ desktop chips OK; **mobile hero chips hidden** | ⚠️ same |
| Why is it different? | ⚠️ implicit (local + community), not stated | ⚠️ |
| How do I earn? | ✅ (5A) "Verkoop of deel" CTA + guest panel | ✅ |
| How does community work? | ⚠️ pulse + Gezocht card (desktop); thin on mobile | ⚠️ |
| How do requests work? | ⚠️ chip + hero chip only | ⚠️ |
| How do services work? | ❌ not communicated anywhere | ❌ |

**Verdict:** desktop hero + sidebar now tell a good story (post-5A). Two structural gaps remain: (1) **mobile** loses the ecosystem chips and community education; (2) **services** are invisible on the homepage despite being creatable.

---

## 5B.3 — Navigation architecture

### Surfaces & entries (verified)
**Bottom nav — `components/navigation/BottomNavigation.tsx` (5 slots):**
1. Discover → `/#homecheff-feed` (scroll to feed)
2. Create (Plus, quick-add flow)
3. Messages → `/messages`
4. Reputation/HCP → `/mijn-hcp` (`bottomNav.reputationTab`, logged-in)
5. Profile → `/profile`

**Header — `components/NavBar.tsx`:** Home `/`, `/werken-bij`, (mobile `/app`), profile/login, messages, `/mijn-hcp`. Profile dropdown: `/profile`, `/messages`, `/profile/deals` (DEALS_PROFILE_PATH), `/orders`, `/favorites`, `/notifications` (mobile), dashboard, `/verdiensten`, admin, `/settings`.

**Role quick links — `lib/navigation/role-quick-links.ts`:** `agreements`(/profile/deals), affiliate QR/share/promo, seller new-offer/orders, delivery dashboard/trust, finance/payout. Surfaces: home sidebar, profile, operations. Role-gated.

**Seller:** `OperationsShell` section nav + `app/verkoper/dashboard` local tabs.
**Delivery:** `components/delivery/DeliveryDashboard.tsx` tabs; public `app/bezorger/[username]`.
**Admin/operations:** ~22 state tabs (`components/admin/*`).
**Profile:** `ProfileV2` 5 tabs (overview/…/community/vertrouwen/inspiratie) + owner sidepanel.
**Settings hub:** 8 tabs.
**Messages:** `/messages`.

### Assessment
- **Duplication:** Create, Messages, HCP, Profile, Deals, Verdiensten appear across 4–6 surfaces (bottom nav + header + dropdown + sidebar + role links).
- **Buried:** buyer Orders, Favorites, Notifications, Affiliate, Settings sub-tabs live only in header overflow/dropdown; **Deals/Afspraken** not in bottom nav.
- **No nav entry at all:** Gezocht, Diensten, Inspiratie-as-destination, Reviews, Fans, Trust, HCP leaderboards.
- **Grouping:** operations (seller/delivery/finance/affiliate) is well consolidated under `OperationsShell`; consumer discovery (browse/requests/services/community) is **not** grouped anywhere.

**Recommendation (no removals):** introduce a single consumer **"Ontdekken"** grouping (a discovery entry that fans out to Te koop / Gezocht / Diensten / Inspiratie / verticals) and promote **Afspraken/Deals** to a first-class consumer destination. Keep operations IA as-is.

---

## 5B.4 — Discovery categories

**Current model:** feed view chips `all · sale · inspiration · gezocht` (`GeoFeed.tsx`) + vertical `<select>` (cheff/garden/designer) + filters. Services render as tile kinds (SERVICE/TASK/WORKSHOP/COACHING badges) but have **no chip and no category** — they are only discoverable if they happen to appear in the feed.

**Problems:** (1) two axes ("what am I browsing": mode chips vs "which vertical": dropdown) split the mental model; (2) services are hidden; (3) `gezocht`/`INSPIRATION` are developer-ish but user-facing labels are OK ("Gezocht"/"Inspiratie").

**Clearest model (recommended, presentational only):**
- **Intent axis (chips):** Alles · Te koop · Gezocht · Diensten · Inspiratie (add a `services` view that filters existing SERVICE/TASK/WORKSHOP/COACHING kinds — no backend change; classification already exists in `derive-listing-kind.ts`).
- **Vertical axis (chips/segmented, promoted from dropdown):** Alles · Eten · Tuin · Creaties.
- Avoid duplicate concepts; no dev terminology in labels.

---

## 5B.5 — Filter architecture (AUDIT ONLY — do not implement)

**Filters present (`GeoFeed.tsx` / FeedFiltersPanel):** scope (nearby/national/international), place/postcode + GPS, radius km (+ mobile presets), main search `q` (`common.searchPlaceholder`), category select (cheff/garden/designer), sort, **refine search `searchQuery`** (`common.searchInProductsSimple`, now under "Verfijn deze resultaten"), price min/max (nested toggle).

**Overlap / issues:**
| Issue | Detail |
|---|---|
| **Two search fields** | `q` (global) + refine `searchQuery` (within results) — top friction |
| **Three filter surfaces** | desktop sidebar panel, mobile toolbar+sheet, inline panel — drift risk |
| **Fragmented reset** | `resetDraftFilters`, `clearFilters`, empty-state two-call reset |
| **Draft vs instant** | text deferred; chips/scope/sort instant — mixed mental model |
| **No desktop applied-filter summary** | mobile has active location chip; desktop none |
| **Category select vs mode chips** | split browse axis (see 5B.4) |
| **Missing** | no explicit "Diensten" filter; no barter/accepted-value filter; no price-model filter |

**Target IA (recommended for a later implementation phase):** one global filter system, **one search**, **one reset**, **one applied-filter overview**, one responsive surface. Not implemented here per instruction.

---

## 5B.6 — Community visibility

**On the homepage today:** tile trust cues (review count, deals count, tier ≥4 "established", first badge 🏅 — sale tiles only), `CommunityPulseBar` "Buurtmomenten" (guest-visible), `HomeReputationCompactCard`, and (post-5A) the Gezocht/help card + guest reputation framing.

**Never discovered by a typical user:**
| Signal | Why hidden |
|---|---|
| **Giving props** | `PropsButton.tsx` orphaned — no render site → the whole give-loop is invisible/broken |
| HCP leaderboards | `/hcp-ranglijsten` public but no link from home/nav |
| Deal & delivery review scores | produced only in flow pages; re-surface aggregated 2 tabs deep |
| Agreements / deals hub | `/profile/deals` not in bottom nav; only sidebar quick link + in-chat cards |
| Per-channel trust ratings | behind profile → community/vertrouwen tabs |
| Fans/follows | profile community tab / favorites only |
| Courier/delivery trust | only bezorger public profiles + profile tab |

**Dead code:** `components/props/PropsButton.tsx`, `components/dorpsplein/ProductReviewSection.tsx` (no render sites).

**Recommendation:** (1) re-wire props-giving on product/profile/inspiration detail (restores an existing-but-broken loop — not new functionality); (2) surface a compact "Afspraken/Deals" entry for consumers; (3) add a link to the public HCP leaderboard.

---

## 5B.7 — Services discovery

`SERVICE / TASK / WORKSHOP / COACHING` are real, creatable listing kinds (`lib/marketplace/contracts/listing-kind-contract.ts`, `derive-listing-kind.ts`) backed by `MarketplaceCategory.ARTISTIC_SERVICE / PRACTICAL_SERVICE / KNOWLEDGE`, with tile badges. They share the marketplace backend but have **no discovery pillar** — no chip, no category, no nav.

**Recommendation (discoverability only, no new backend):** add a **"Diensten"** feed view (client-side filter over the already-derived service kinds) and a homepage/nav pointer. This reuses `deriveListingKind` classification and the existing feed API `listingKind` filter — zero schema/API change.

---

## 5B.8 — Mobile-first UX

**Native-feel strengths:** compact feed-first hero, bottom nav with large touch targets (`min-h-[48–52px]`), density default 1 (Phase 4), instant back (return cache), mobile filter bottom sheet + radius presets.

**Desktop assumptions still present on mobile:**
| Area | Gap |
|---|---|
| Hero | ecosystem chips + orbit + platform strip are `hidden sm:`/`lg:` → mobile users don't see the ecosystem breadth |
| Community | no sidebar; only a single-line pulse insert; deals/trust absent |
| Discovery | services/verticals not reachable without opening the filter sheet |
| Applied filters | fine on mobile (active location chip) — better than desktop here |

**Recommendation:** a lightweight mobile "what you can do here" strip (2–3 tappable ecosystem entries incl. Gezocht/Diensten) without increasing hero height; keep feed-first.

---

## 5B.9 — Marketplace identity

HomeCheff must read as **marketplace + community + requests + services + delivery + trust + collaboration + local economy** — not "a place to buy food." Today, without naming competitors:
- **Communicated:** local/nearby, buy/sell, verticals, inspiration, community activity (pulse), trust cues.
- **Under-communicated:** requests (Gezocht only implicit), services (invisible), collaboration/negotiation, delivery-as-community, the fact that value can be exchanged non-monetarily.

**Recommendation:** a single hero-adjacent "één lokaal platform" statement + the discovery-pillar chips (5B.4) do most of the identity work with copy/presentational changes only.

---

## 5B.10 — Visual hierarchy (per major surface)

| Page | 1st attention | 2nd | 3rd | Matches goal? |
|---|---|---|---|---|
| Homepage (desktop) | hero | feed cards | filters/sidebar | ✅ mostly |
| Homepage (mobile) | hero strip | feed cards | (filters hidden in sheet) | ⚠️ ecosystem breadth lost |
| Feed tile | media | title/price | trust cue/value row | ✅ |
| Product detail | media/title | price + primary action | trust strip/reviews | ✅ |
| Profile (ProfileV2) | header/avatar | tabs | tab content | ⚠️ trust/fans buried in tabs |
| Deals hub | proposals/deals list | agenda | courier strip | ✅ (once found) |

**Verdict:** tile and detail hierarchy are strong; profile buries trust/community; mobile homepage buries ecosystem breadth.

---

## 5B.11 — Consistency

- **Cards/tiles:** strongly factored (`MarketplaceTileRouter` + shared primitives: `TileMedia`, `TilePersonRow`, `TileValueRow`, `TileTrustCue`, `build-tile-badges`) — coherent.
- **Chips:** consistent active styling across breakpoints (Phase 5).
- **Terminology:** mostly consistent NL/EN (parity validated); minor jargon ("Dorpsplein", "Buurtmomenten") undefined for newcomers.
- **Icons/CTAs:** Compass=discover, Plus=create used consistently; reputation uses Award/⭐ consistently.
- **Inconsistency:** filters (three surfaces, dual search); verticals as dropdown vs modes as chips; profile trust depth vs tile trust cue.

---

## 5B.12 — Future-proofing

- **Verticals:** `ProductCategory` enum (CHEFF/GROWN/DESIGNER) + slug mapping (`resolveProductCategory`) — adding a vertical needs an enum + mapping + label; a **chip-based vertical axis** scales better than the current `<select>`.
- **Listing types:** runtime-derived `listingKind` (`derive-listing-kind.ts`) — new kinds are additive, no schema churn. A **kind-driven discovery pillar system** is future-proof.
- **Services:** already additive via `MarketplaceCategory`; a "Diensten" view scales without redesign.
- **Countries/languages:** i18n is namespaced with NL/EN parity validators; scope filter already has national/international. IA should keep labels in i18n (no hardcoded strings) — currently mostly true.

**Verdict:** the data model is future-proof; the **presentation IA (dropdown verticals, feed-only discovery, task-thin nav)** is what would force a later redesign. Moving discovery to a pillar/axis model now prevents that.

---

## Prioritized roadmap (non-destructive; later implementation phases)

| Prio | Item | Type | Risk |
|---|---|---|---|
| P0 | Re-wire **props-giving** UI (restore orphaned `PropsButton` on detail/profile) | Bug/discoverability | Low |
| P0 | **Services discovery view** (client filter over existing service kinds) + homepage pointer | Presentational | Low |
| P1 | **Discovery pillars**: promote verticals from `<select>` to a chip/segment axis; add "Diensten" intent chip | Presentational | Med |
| P1 | **Afspraken/Deals** as a first-class consumer destination (nav/home), not just sidebar/chat | IA | Med |
| P1 | **Mobile ecosystem strip** (Gezocht/Diensten/verticals) without added hero height | Mobile | Low |
| P2 | **Unified filter surface**: one search, one reset, one applied-filter overview (5B.5) | Refactor | Med-High |
| P2 | Homepage **community proof** (deals/reviews) beyond login-gated sidebar | Presentational | Med |
| P2 | Link **HCP leaderboard** (`/hcp-ranglijsten`) from home/nav | IA | Low |
| P3 | Deprecate dead code (`PropsButton` if not rewired, `dorpsplein/ProductReviewSection`) + stale `home.*` i18n | Cleanup | Low |

All items are additive/presentational — none change backend, APIs, ranking, marketplace logic, or the Phase 4/4B/4C performance architecture.

---

## Performance & non-regression statement (5B constraints)

This phase makes **no runtime code changes** (audit + docs + validator only). Preserved and re-verified by validators: return cache, unified SWR (4C), instant navigation, desktop density default 2 / mobile 1, no density refetch, single GeoFeed mount, no duplicate mounts, no debug logging.

---

## Validation

```
npx tsx scripts/validate-discovery2-information-architecture.ts   # IA structure + perf guard
npx tsx scripts/validate-discovery-phase5a.ts                     # 32/32 (5A regression)
npx tsx scripts/validate-discovery-experience.ts                  # 23/23 (5 regression)
npx tsx scripts/validate-runtime-performance-phase4c.ts           # 26/26 (4C regression)
npm run build                                                     # pass
```
