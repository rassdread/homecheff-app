# HomeCheff — Global UX, Navigation & Information-Architecture Audit

**Phase:** UX Finalization — Phase 1 (audit only)
**Date:** 2026-07-07
**Method:** Static code trace of `app/**`, `components/**`, `lib/**` + three parallel read-only explorations of navigation, end-to-end flows, and information architecture / design system.
**Scope:** Analysis only — **no code changed, nothing renamed, nothing removed.** This document feeds the definitive UX Finalization Roadmap.

Related: [ROUTE_OWNERSHIP.md](../architecture/ROUTE_OWNERSHIP.md) · [AGREEMENTS_HUB_AUDIT.md](./AGREEMENTS_HUB_AUDIT.md) · [COMMUNITY_OPERATIONS_HUB_AUDIT.md](./COMMUNITY_OPERATIONS_HUB_AUDIT.md)

---

## 0. Executive summary

HomeCheff is functionally complete but does **not yet feel like one product**. The three biggest cross-cutting problems:

1. **Discoverability gaps for buyers.** Several real, shipped screens have **no navigation entry point** (`/favorites`, `/reservations`, `/orders` for buyers, `/notifications` on mobile). A buyer-only account effectively cannot reach its own transactional pages from any menu.
2. **Duplication of surface and primitive.** The same "deal" is managed on 3 screens and rendered by 6 card components; there are 2 delivery-settings pages, 3 public-profile surfaces, a typo-mirrored `aviliate/*` section, and 2 unused design primitives (`HcButton`/`HcCard`) while ~200 files hand-roll raw `<button>`.
3. **Terminology drift.** deal / afspraak / agreement / proposal / communityOrder — and verkoper/seller, bezorger/delivery/courier, gezocht/request — are used interchangeably across UI labels, routes, component names and lib modules.

There are also **2 correctness gaps in the core Community-Economy loop** (blank proposal prefill for REQUEST/SERVICE, and no in-flow courier acquisition) and a **stale validator** that no longer matches shipped nav.

Problem register with priorities is in [§11](#11-prioritized-problem-register).

---

## 1. Onderzoek 1 — Hoofdstructuur (route inventory)

`app/**` contains **123 page routes**. The user-facing primary structure:

| Function | Current route(s) | Doel | Overlap | Aanbeveling |
|---|---|---|---|---|
| Home / Discovery | `/` (`app/page.tsx`) | Feed, tiles, chips (`?chip=sale/gezocht`) | `/dorpsplein`→`/`, `/inspiratie`→`/` redirects | Canonical. Update docs that still call `dorpsplein`/`inspiratie` "canonical". |
| Marketplace detail | `/product/[id]`, `/request/[slug]` | Listing + commerce zone | Both render `ListingDetailPage` (intended) | OK |
| Inspiration detail | `/recipe/[id]`, `/garden/[id]`, `/design/[id]` | Portfolio/inspiration (no commerce) | Render `InspiratieDetail`; **no proposal/order CTA** | Add "find the sellable listing" path or a proposal CTA (P2) |
| Gezocht / REQUEST | `/?chip=gezocht#homecheff-feed`, `/request/[slug]` | Buy-requests | label "gezocht" vs route "request" | Align terminology (P2) |
| Mijn Afspraken | `/profile/deals` (`/agreements`→redirect) | Operations cockpit | `/agreements` alias | Canonical; give it a real top-level/bottom-nav entry (P1) |
| Inbox | `/messages`, `/messages/[conversationId]` | Chat + proposal authoring | proposal authoring only lives here | OK, but see Flow A (P1) |
| Profiel (eigen) | `/profile`, `/profile/deals`, `/profile/privacy`→redirect | Owner profile (tabs) | — | OK |
| Profiel (publiek) | `/user/[username]`, `/seller/[sellerId]`, `/bezorger/[username]` | Public profile | **3 surfaces for 1 person** | 301 `seller`/`bezorger` → `user` (P1, doc already intends this) |
| Orders (koper) | `/orders`, `/orders/[orderId]` | Buyer purchases | vs seller orders | Canonical buyer; **needs nav entry** (P1) |
| Orders (verkoper) | `/verkoper/orders` (`/seller/orders`→redirect) | Seller incoming | `seller/orders` JS-redirect stub | Convert stub to config redirect (P3) |
| Reserveringen | `/reservations` | — | **mock/prototype, fake data** | Dead — remove in build phase (P2) |
| Delivery ops | `/delivery/dashboard`, `/delivery/signup` | Courier work | — | Canonical |
| Delivery settings | `/delivery/settings` **and** `/delivery/instellingen` | Courier profile settings | **2 pages, 2 APIs, same job** | Collapse to one (P1) |
| Delivery profiel | `/delivery/profiel`→`/bezorger/[username]` | redirect | — | OK |
| Instellingen | `/settings`, `/settings/app` | Settings hub + native app prefs | `verkoper/instellingen`→redirect, `profile/privacy`→redirect | Good consolidation; unify notification prefs (P2) |
| Verdiensten | `/verdiensten`, `/verkoper/revenue` | Combined earnings vs seller revenue | `verkoper/revenue` overlaps a `verdiensten` panel | Keep as role deep-link; label clearly (P3) |
| HCP (punten) | `/mijn-hcp`, `/hcp-ranglijsten` | Gamification points + leaderboard | conceptually adjacent to "verdiensten" | Clarify "points ≠ euros" labeling (P2) |
| Operations | `/operations/vandaag` | Role dashboard hub | — | Canonical |
| Affiliate | `/affiliate/*` | Partner program | **`/aviliate/*` typo mirror (dead)** | Delete `aviliate/*` (P2, redirects already exist) |
| Checkout | `/checkout` | Cart checkout | desktop uses drawer, mobile navigates | Unify cart interaction (P2) |
| Reviews | `/deal-review/[id]`, `/delivery-review/[id]`, `/review/[token]` | 3 review channels | 3 separate systems | Consolidate entry points (P2) |
| SEO landings | `/[seoSlug]`, `/en/[seoSlug]`, `/maaltijden/[stad]`, `/eten-verkopen-[stad]`, ~11 hardcoded topic pages | Programmatic SEO | **4 parallel mechanisms** | Consolidate onto `[seoSlug]` engine (P2) |
| Admin | `/admin/*` | Back office | — | OK (desktop-first, see §9) |
| Auth/onboarding | `/login`, `/register`, `/onboarding/*`, `/auth/*` | Auth | — | OK |

---

## 2. Onderzoek 2 — Navigatie

### 2.1 Navigation surfaces inventoried

| # | Surface | File | Viewport |
|---|---------|------|----------|
| 1 | Top header / NavBar | `components/NavBar.tsx` | desktop (`md:flex`, extra `lg:flex`) |
| 2 | Mobile hamburger drawer | `components/NavBar.tsx` (`md:hidden`) | mobile |
| 3 | Bottom tab bar + FAB | `components/navigation/BottomNavigation.tsx` | phone/tablet (hidden `lg+` and on `/admin`,`/delivery`,`/login`,`/register`,`/auth`) |
| 4 | Footer | `components/Footer.tsx` | all (compact bar on mobile) |
| 5 | Role quick links | `lib/navigation/role-quick-links.ts` + `RoleQuickLinksSection.tsx` | home sidebar / profile sidepanel / operations sidepanel |
| 6 | Legal & contact block | `components/nav/NavbarLegalContactLinks.tsx` | dropdown + mobile menu |
| 7 | Operations section tabs | `lib/operations/operations-tabs.ts` + `OperationsSectionNav.tsx` | operations pages |
| 8 | Profile V2 tab nav + owner sidepanel | `components/profile/v2/ProfileV2TabNav.tsx`, `ProfileV2OwnerSidepanel.tsx` | profile pages |

### 2.2 Same page reachable multiple ways (redundant/over-entry)

| Route | Surfaces |
|---|---|
| `/` | header, mobile menu, bottom nav (Ontdekken), footer logo |
| `/profile` | header, dropdown, mobile menu (×2), bottom nav, operations + profile sidepanels |
| `/messages` | header (lg), dropdown, mobile menu, bottom nav, home + operations quick links |
| `/mijn-hcp` | header (lg), dropdown, bottom nav capsule, profile sidepanel |
| `/operations/vandaag` | dropdown, mobile menu, bottom nav Dashboard, operations tab |
| `/verdiensten` | dropdown/mobile "combined earnings", operations tabs, quick links (finance) |

These are not bugs, but the **labels differ per surface** (see 2.4).

### 2.3 Missing / weak entry points

| Route | Status | Impact |
|---|---|---|
| `/favorites` (`app/favorites/page.tsx`) | **No nav entry anywhere.** Not a Profile V2 tab either. | Orphaned feature |
| `/reservations` | **No nav entry** (also mock data) | Dead |
| `/orders` (buyer) | Only linked from `payment/success`. Not in header, bottom nav, or sidepanels | Buyers can't find purchase history |
| `/notifications` | Only via desktop/tablet `NotificationBell`. **No mobile entry** | Phone users can't reach notifications |
| `/profile/deals` (Mijn Afspraken) | Only via quick links + profile sidepanel; never header/bottom nav | Low discoverability for a first-class hub |
| `/verkoper/revenue` | Not surfaced in any tab/quick link (finance → `/verdiensten`) | Deep-link only |

**Worst case:** a buyer-only account (`showDashboardTab` is false for non-earning roles in `BottomNavigation.tsx`) has navigation only to `/profile`, `/messages`, `/mijn-hcp` — with `/orders`, `/favorites`, `/reservations` all orphaned, they cannot navigate to any of their own transactional pages.

### 2.4 Label / interaction inconsistencies

- **Profile tab label** is `bottomNav.myHC` ("Mijn HC") when authed, `bottomNav.profile` ("Profiel") for guests, and "Mijn profiel"/"Profiel" in the header — 3 labels, 1 destination.
- **Dashboard label** switches "Dashboard" ↔ "Verdienen" by auth in bottom nav; header calls the same route "Dashboard".
- **Cart** opens a **drawer** on desktop but navigates to **`/checkout`** on mobile — two interaction models.
- **`/verdiensten`** is "combined earnings" in header, "finance" in operations tabs, "finance" in quick links.
- **Create/Delen** is a button in 3 places (header CTA, home sidebar, FAB) with 3 slightly different guest-handling behaviors.

---

## 3. Onderzoek 3 — Linker zijbalk (waar hoort wat)

Inventory of what should ultimately live where (recommendation only, nothing changed):

| Onderdeel | Nu bereikbaar via | Voorstel: primaire nav | Voorstel: onder Profiel | Voorstel: onder Community |
|---|---|---|---|---|
| Home / Discovery | overal | ✅ primair | | |
| Marketplace / Gezocht | feed chips | ✅ primair | | |
| Mijn Afspraken (`/profile/deals`) | quick links | ✅ primair (ontbreekt nu) | | |
| Inbox (`/messages`) | overal | ✅ primair | | |
| Notifications | desktop bell | ✅ primair (mobiel ontbreekt) | | |
| Orders (koper) | vrijwel nergens | | ✅ onder Profiel | |
| Favorites | nergens | | ✅ onder Profiel (tab) | |
| Profiel (eigen) | overal | ✅ primair | | |
| Verdiensten / Operations | dropdown/tabs | | ✅ onder Profiel/rol | |
| Delivery dashboard | quick links | | | ✅ onder Community/rol |
| HCP / ranglijsten | header/bottom | | ✅ onder Profiel | ✅ community-leaderboard |
| Settings | dropdown | | ✅ onder Profiel | |
| Affiliate | footer/ops | | ✅ onder rol | |

Primary nav is currently overloaded with `/` , `/profile`, `/messages`, `/mijn-hcp`, dashboard — while the two hubs users most need daily (**Mijn Afspraken** and **buyer Orders/Favorites**) are pushed into sidepanels or orphaned.

---

## 4. Onderzoek 4 — Rechter zijbalk (quick widgets — data readiness)

The data for a right-rail "cockpit" already exists (mostly from CE-2B `AgreementsHubSummary` + existing APIs). **No new backend needed.**

| Widget | Data source (bestaand) | Beschikbaar? |
|---|---|---|
| Vandaag gepland | `AgreementsHubSummary.plannedTodayCount` / agenda `today` bucket | ✅ |
| Volgende afspraak | `AgreementsHubSummary.nextAgreement` | ✅ |
| Eerstvolgende actie | `AgreementsHubSummary.nextAction` | ✅ |
| Open voorstel | agenda proposals + `proposalsToRespondCount` | ✅ |
| Open betaling | `AgreementsHubSummary.waitingPaymentCount` / `WAITING_PAYMENT` facet | ✅ |
| Actieve bezorging | `AgreementsHubSummary.activeDeliveryCount` / courier `/api/delivery/community-requests` | ✅ |
| Exchange suggestions | `lib/discovery/opportunities/*` | ✅ |
| Favorieten | `/api/profile/favorites` | ✅ |
| Concepten (drafts) | seller draft state (sell flow) | ⚠️ partial |
| Laatst bekeken | client history (needs light tracking) | ⚠️ needs small client store |

**Conclusion:** ~8/10 widgets can be built purely on existing data (the CE-2A/2B "sidebar readiness" work already exposes the summary object). Only "drafts" and "recently viewed" need minor plumbing.

---

## 5. Onderzoek 5 — Homepage reis per rol

| Rol | Huidige reis | Ontbreekt / dubbel |
|---|---|---|
| Nieuwe (guest) | `/` feed → tile → detail → proposal/chat **bounces to login** (`StartChatButton` soft-gate) | No clear "what is HomeCheff" onboarding before the auth wall; create/proposal both gate silently |
| Ingelogde koper | `/` feed → detail → chat proposal → `/profile/deals` | No nav to `/orders`/`/favorites`; deal managed in 2 places |
| Aanbieder (seller) | FAB/CTA → `/sell/new`; ops via `/operations/vandaag` | Create entry differs per surface; `verkoper` vs `seller` naming |
| Helper (REQUEST) | `/?chip=gezocht` → `/request/[slug]` → proposal (chat) | **Proposal composer opens blank** (prefill PRODUCT-only) |
| Bezorger | `/delivery/dashboard` | Bottom nav hidden on `/delivery/*` → stuck without global nav; no in-flow courier acquisition for parties |
| Community member | `/` + `/gemeenschap/[segment]` + `/mijn-hcp` | HCP (points) easily confused with verdiensten (euros) |

**Screens that can be retired from the journey:** `/reservations` (mock), `/dorpsplein` (redirect), `/aviliate/*` (dead), `/place` (mock save).

---

## 6. Onderzoek 6 — Marketplace flow (tiles → preview → detail → proposal → deal → agenda)

**Order of screens** (all confirmed in source):
`/` feed (`GeoFeed` → `MarketplaceTileRouter`) → preview (`MarketplacePreviewShell`) → `/product/[id]` or `/request/[slug]` (`ListingDetailPage` → `ProductSaleCommerceZone`) → **`/messages/[conversationId]`** (proposal authored here via `StartChatButton` + `ProposalCard`) → deal (`DealCard` in chat) → `/profile/deals` (`ProfileDealCard`).

**Findings:**
- **P1 — Proposal always ejects to chat.** There is no on-listing proposal composer; every proposal CTA (`ProductSaleProposalAction`, sticky, preview) navigates to `/messages/[id]`. The pivot of the whole marketplace forces a context switch away from the item.
- **P1 — Deal managed in 3 places.** `DealCard` (chat), `ProfileDealCard` (`/profile/deals`), and the `ProfileDealsClient` summary all render/act on the same deal, so users oscillate between chat and the hub.
- **P2 — Inspiration detail dead-ends commerce.** A dish tile can route to `/recipe/[id]` (`InspiratieDetail`) which has only contact channels — no proposal/order CTA.
- **P2 — Preview ↔ detail duplication.** Description, payment, fulfillment, accepted-values, and trust blocks are re-rendered in both preview and detail.

Information to move: none structurally required; the highest-value change (for the build phase) is an **inline proposal sheet on the listing** so the flow doesn't eject to chat.

---

## 7. Onderzoek 7 — Community Economy closed loop

`REQUEST → Proposal → Deal → Delivery → Agreement → Review → Trust → Discovery` — traced hop by hop; the loop **closes** (trust feeds `lib/discovery/ranking/ranking-profiles.ts` and tile cues via `build-tile-trust-cue.ts`). Interruptions found:

| # | Onderbreking | Locatie | Prioriteit |
|---|---|---|---|
| a | **Proposal prefill blank for non-PRODUCT** — `baseFromHeader` only fills when `kind==='PRODUCT'`, so REQUEST/SERVICE/TASK/COACHING proposals open empty | `lib/proposals/proposal-prefill.ts` | **P1** |
| b | **No in-flow courier acquisition** — after `REQUEST_DELIVERY` the request waits for a courier to self-discover on `/delivery/dashboard`; parties get only `VIEW_DELIVERY`, no "invite courier" CTA (though `assignCourier` exists server-side) | `deal-ux-state.ts`, `delivery-request-service.ts` | **P1** |
| c | **Delivery request can be created with null addresses** — `createFromCommunityOrder` falls back to possibly-null defaults | `lib/delivery/delivery-request-service.ts` | P2 |
| d | **Unilateral completion** — either party can mark `COMPLETED` (barter legs have no two-sided confirm) | `lib/trust/community-order-service.ts` | P2 |
| e | **Three parallel review systems** feed trust separately (`/deal-review`, `/delivery-review`, `/review/[token]`) | reviews | P2 |
| f | **Trust payoff invisible at point of action** — the ranking/tile boost appears later on the feed, far from completion | ranking/feed | P3 |

---

## 8. Onderzoek 8 — Information architecture (duplicates / legacy / dead)

| Cluster | Canonical | Legacy redirect / stub | Dead / mock |
|---|---|---|---|
| Affiliate | `affiliate/*` | (typo handled in `next.config.mjs`) | **`aviliate/*`** (redirect-shadowed, unreachable) |
| Seller | `verkoper/*` (owner) | `seller/orders` (JS redirect), `verkoper/instellingen` | — |
| Public profile | `user/[username]` | `seller/[sellerId]`, `bezorger/[username]` **(should 301 per docs, still render full UI)** | — |
| Delivery settings | `delivery/settings` | `delivery/profiel` | **`delivery/instellingen`** (2nd settings UI, different API) |
| Settings | `settings` | `profile/privacy`, `verkoper/instellingen` | — |
| Orders | `orders` (buyer), `verkoper/orders` (seller) | `seller/orders` | **`reservations`** (mock data, off-system styling) |
| Community/feed | `/` (+ `gemeenschap/[segment]`) | `dorpsplein`, `inspiratie`, `agreements`→`profile/deals` | `place` (mock save) |
| SEO landings | `[seoSlug]` engine | — | fragmented across **4** mechanisms |

**Component-level duplication:**
- **Deal/proposal entity → 6 cards:** `AgreementHubDealCard`, `AgreementHubProposalCard`, `ProfileDealCard`, `chat/proposals/DealCard`, `chat/proposals/ProposalCard`, `chat/proposals/CommunityOrderSummaryCard`.
- **Listing tile → 5+ cards:** `ItemCard`, `FeedMarketplaceCard`, `MarketplacePreviewCard`, `GeoFeedCards`, `HomeVerticalCards`.
- **Deal-UX logic duplicated** across `DealCard` and `ProfileDealCard` (both call `resolveDealUxState`, reimplement `requestDelivery`/`markComplete`).

**Tooling drift (real):** `scripts/validate-community-economy-loop.ts:181` asserts `PROFILE_DEALS_NAV.href === '/agreements'`, but the shipped value is `/profile/deals` — the script would **fail** and is out of sync with nav (not run in riedel). Also `docs/architecture/ROUTE_OWNERSHIP.md` mislabels `dorpsplein`/`inspiratie` as canonical and marks profile 301s as done when they aren't.

---

## 9. Onderzoek 9 — Mobile UX

- **Consumer flows are broadly mobile-first** (feed, product, profile, checkout use `sm:`/`md:` + `max-w-*`).
- **Back-office & finance are desktop-first** — raw `<table>` with no stacking/`overflow-x-auto` in: all `components/admin/*` dashboards, `AnalyticsDashboard`, `UnifiedAnalyticsDashboard`, `GoogleAnalyticsAdvancedDashboard`, and — user-facing — **`components/seller/SellerFinancialManagement.tsx`**, plus `app/admin/hcp`, `app/over-ons`, both `passive-income-calculator` pages.
- **Off-system legacy:** `app/reservations` uses inline CSS-variable styles and fixed desktop widths.
- **Fixed-pixel widths** in map/media/dashboard components (`UserMap`, `ProductMapView`, `LiveLocationMap`, `OperationsFinanceHero`, `verkoper/dashboard/page-client`).
- **Hover-only affordances:** shared `Button` uses `hover:-translate-y-0.5`; marketplace previews are hover/long-press — verify tap equivalents on touch.
- **Bottom nav hidden on `/delivery/*`** → couriers lose global nav inside their own area.

---

## 10. Onderzoek 10 — Design consistency

- **Two primitive families, one unused.** `Button` (`rounded-2xl`, token `primary-brand`) vs `HcButton` (`rounded-md`, sizes, `loading`, token `primary-600`); `Card` vs `HcCard`. `HcButton`/`HcCard` are referenced **only in their own files** — orphaned half-migration. The two "official" buttons even disagree on the brand token.
- **Shared Button is the minority.** `@/components/ui/Button` imported in ~34 files; raw `<button className=…>` in **200+** files (e.g. `ImprovedFilterBar` 27, `ShareButton` 24, `GeoFeed` 24). `bg-emerald-600` / `bg-primary-600` / `bg-primary-brand` and `rounded-lg/xl/2xl` all coexist.
- **Status pills re-implemented inline** (own `getStatusColor`/`statusConfig`) in `orders`, `verkoper/orders`, `verkoper/dashboard`, admin `OrderManagement`/`DeliveryManagement`/`AffiliateManagement`, `notifications/OrdersTab`, etc., instead of the shared `components/ui/Tag`. Same status looks different across buyer/seller/admin.
- **Terminology drift** (biggest issue): deal/afspraak/agreement/proposal/communityOrder; verkoper/seller; bezorger/delivery/courier; gezocht/request/REQUEST — mixed across labels, routes, component names, and lib modules.

---

## 11. Prioritized problem register

**P0 = broken/blocking · P1 = high impact on "one product" feel · P2 = medium · P3 = polish.**

| ID | Probleem | Locatie | Impact | Prio | Aanbevolen oplossing |
|----|----------|---------|--------|------|----------------------|
| N1 | Buyer-only accounts have no nav to `/orders`, `/favorites`, `/reservations` | `BottomNavigation.tsx` (`showDashboardTab`), missing links | Buyers can't reach own transactions | **P1** | Add a buyer "Mijn HomeCheff" entry (orders/favorites/deals) to bottom nav + profile sidepanel |
| N2 | `/favorites` orphaned (no entry, not a profile tab) | `app/favorites`, Profile V2 tabs | Feature invisible | **P1** | Add Favorites as a Profile V2 tab and/or right-rail widget |
| N3 | `/notifications` unreachable on mobile | `NotificationBell` (md+ only) | Mobile users miss notifications | **P1** | Add notifications entry to mobile menu / bottom nav |
| N4 | `/profile/deals` (Mijn Afspraken) not in header/bottom nav | nav surfaces | Core hub hard to find | **P1** | Promote to primary nav / bottom-nav tab |
| F1 | Proposal always ejects to `/messages` | `StartChatButton`, `ProductSaleProposalAction` | Context switch at the pivot of every flow | **P1** | Inline proposal sheet on listing; open chat only after submit |
| F2 | Proposal prefill blank for REQUEST/SERVICE/TASK/COACHING | `lib/proposals/proposal-prefill.ts` | Core community loop opens empty forms | **P1** | Extend `baseFromHeader` beyond `PRODUCT` |
| F3 | No in-flow courier acquisition after delivery request | `deal-ux-state.ts`, `delivery-request-service.ts` | Parties hit a "now what?" dead-end | **P1** | Add "invite/see couriers" CTA using existing `assignCourier` |
| I1 | 3 public-profile surfaces for one person | `user/[username]`, `seller/[sellerId]`, `bezorger/[username]` | Duplicate SEO + confusion | **P1** | Implement the documented 301s to `/user/[username]` |
| I2 | 2 delivery-settings pages, 2 APIs | `delivery/settings` vs `delivery/instellingen` | Divergent state, maintenance risk | **P1** | Collapse into one settings screen/API |
| D1 | Terminology drift deal/afspraak/agreement/seller/courier/request | app-wide | Hard to reason about & localize | **P1** | Pick canonical terms; align labels/routes/components/lib incrementally |
| I3 | `aviliate/*` dead typo mirror | `app/aviliate/*` | Dead code (redirect-shadowed) | **P2** | Delete dir (redirects already in `next.config.mjs`) |
| I4 | `/reservations` mock/dead + off-system styling | `app/reservations` | Dead code, inconsistent UI | **P2** | Remove |
| I5 | 4 parallel SEO-landing mechanisms | `[seoSlug]`, `maaltijden/[stad]`, `eten-verkopen-[stad]`, ~11 topic pages | Content sprawl | **P2** | Consolidate onto `[seoSlug]` |
| C1 | 2 unused design primitives; ~200 raw `<button>` | `HcButton`/`HcCard` vs `Button`; app-wide | Visual inconsistency | **P2** | Choose one primitive family; codemod raw buttons; reconcile `primary-brand`/`primary-600` |
| C2 | Status pills re-implemented per screen | orders/seller/admin | Same status looks different | **P2** | Route all through `components/ui/Tag` + shared status map |
| F4 | Inspiration detail has no commerce CTA | `InspiratieDetail` for `/recipe|garden|design/[id]` | Transaction dead-end | **P2** | Add "find sellable listing"/proposal CTA |
| F5 | 3 review systems feed trust separately | `deal-review`/`delivery-review`/`review/[token]` | Fragmented, token review disconnected | **P2** | Surface all reviews from `/profile/deals` |
| M1 | Back-office/finance desktop-first tables (incl. user-facing `SellerFinancialManagement`) | admin/analytics/seller finance | Mobile overflow | **P2** | Responsive/stacking table pattern, start with seller finance |
| F6 | Delivery request can have null addresses | `delivery-request-service.ts` | Unroutable jobs | P2 | Guard non-null before create |
| F7 | Unilateral deal completion | `community-order-service.ts` | Trust gap on barter | P2 | Two-sided confirm for value-only |
| X1 | Cart drawer (desktop) vs `/checkout` (mobile) | `CartIcon` / mobile menu | Two interaction models | P2 | Unify cart UX |
| X2 | Label drift per surface (Profiel/Mijn HC, Dashboard/Verdienen, combined-earnings/finance) | nav surfaces | Inconsistent mental model | P3 | One label per destination |
| T1 | `validate-community-economy-loop.ts:181` asserts `/agreements` (stale) | script | Validator would fail | P3 | Update assertion to `/profile/deals` |
| T2 | `ROUTE_OWNERSHIP.md` drift (dorpsplein/inspiratie "canonical"; profile 301s marked done) | docs | Misleading source of truth | P3 | Update doc |
| X3 | `seller/orders` JS-redirect stub (flash) | `app/seller/orders` | Loading flash | P3 | Config-level redirect |
| N5 | Bottom nav hidden inside `/delivery/*` | `lib/bottomNavRoutes.ts` | Couriers lose global nav | P3 | Allow bottom nav or add in-area nav |

---

## 12. Suggested UX Finalization Roadmap (post-audit)

Grouped for the follow-up build phases (not part of this audit):

1. **UX-Fin 2 — Navigation completeness (P1 N1–N4):** buyer hub entry, favorites tab, mobile notifications, promote Mijn Afspraken.
2. **UX-Fin 3 — Flow continuity (P1 F1–F3):** inline proposal sheet, prefill for all kinds, in-flow courier acquisition.
3. **UX-Fin 4 — IA consolidation (P1 I1–I2, P2 I3–I5):** 301 public profiles, one delivery-settings, delete dead routes, consolidate SEO.
4. **UX-Fin 5 — Design system (P1 D1, P2 C1–C2):** canonical terminology, one primitive family, shared status pills.
5. **UX-Fin 6 — Mobile & trust polish (P2 M1, F4–F7):** responsive back-office, unified reviews, delivery/trust guards.
6. **Housekeeping (P3):** validator + doc updates, cart unification, label alignment.

---

*Audit only — no code was modified. Screenshots were not captured (static trace); component/route references are provided in lieu of screenshots as requested.*
