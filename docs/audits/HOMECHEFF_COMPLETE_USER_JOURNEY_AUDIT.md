# HomeCheff — Complete User Journey Audit

**Phase:** UX Finalization — Phase 3 (audit only)
**Date:** 2026-07-07
**Method:** Static code trace of `app/**`, `components/**`, `lib/**`, `public/i18n/*` via four parallel read-only explorations (first-impression, copy/i18n parity, UI-consistency/states, per-role journey polish) + targeted verification of high-impact findings.
**Scope:** Analysis and polish recommendations only — **no code changed, nothing renamed, nothing removed, no redesigns.** Builds on and does not repeat [HOMECHEFF_GLOBAL_UX_NAVIGATION_AUDIT.md](./HOMECHEFF_GLOBAL_UX_NAVIGATION_AUDIT.md) (Phase 1, nav/IA) — Phase 3 adds the journey / copy / visual-polish lens.

Related: [ROUTE_OWNERSHIP.md](../architecture/ROUTE_OWNERSHIP.md) · [UX_NAVIGATION_COMPLETENESS_AUDIT.md](./UX_NAVIGATION_COMPLETENESS_AUDIT.md)

---

## 0. Executive summary

The core flows work and the **operations hub (`/profile/deals`) is the most polished, fully-i18n surface** in the app. The gap between "functional" and "feels like one finished product" is now dominated by **presentation polish**, concentrated in five recurring themes:

1. **One real, user-visible i18n bug (P0).** The runtime `t()` only interpolates single-brace `{x}`, but **61 keys use `{{x}}`** — concentrated in the trust cues shown on tiles/detail/preview. `"{{count}} afgeronde afspraken"` renders as literal **`"{5} afgeronde afspraken"`** to users.
2. **Hardcoded Dutch on money-path screens (P1).** Checkout order-summary, payment-success, and the CartDrawer are largely hardcoded Dutch — so **English users see Dutch at the moment they pay**, and two literal display bugs ship there (`van Verkoper`, `Product ID: <cuid>`).
3. **UI-primitive fragmentation (P1/P2).** Only `Button` (33 files) and `EmptyState` (1 file) of the design system are adopted; `HcButton`/`HcCard`/`Card`/`Tag`/`Input`/`LoadingSkeleton` have **0 external imports** while ~250 files hand-roll `<button>`. Three "primary green" tokens (`primary-brand` / `primary-600` / `emerald-600`) and `rounded-lg/xl/2xl` coexist within single journeys.
4. **Status chips reinvented ≥6 times (P2).** The same status renders in different colors across buyer/seller/admin/notifications/deal-card screens. `alert()` (~240 calls) is the de-facto error channel.
5. **First-impression clarity (P1).** No persistent "what is HomeCheff / you can buy *and* sell" line above the fold; **"Gezocht" has no guest explanation**; mobile guests lose the category/vertical chips that carry the "more than meals" message; `/favorites` is actually a *Fans* page.

Nothing here requires a redesign. The full prioritized register is in [§13](#13-prioritized-friction-register-p0p3); quick wins vs bigger items in [§14](#14-quick-wins-vs-bigger-improvements).

---

## 1. Complete user journeys per role

### 1.1 New / guest
`/` hero + feed → tile → preview → detail → (chat/propose or create) **soft-auth gate** → register/login (intent preserved).
- Soft-gates are **good** (contextual copy + intent preserved: `SoftAuthGateHost.tsx`, `guestSalesPanels.*`, `guestBottomNav.*`).
- Conceptual gaps: no always-visible "what is HomeCheff / koop én verkoop"; **REQUEST/"Gezocht" unexplained** for guests; mobile guests lose category & vertical chips (they're `hidden lg:block` in `HomeHeroSection.tsx`).

### 1.2 Buyer
`/` → detail (`ListingDetailPage` → `ProductSaleCommerceZone`) → proposal (ejects to `/messages`) → deal (`DealCard`) → **checkout** (`app/checkout/page.tsx`) → **payment success** (`app/payment/success`) → `/orders` → review.
- Now reachable in nav after Phase 2 (`/orders`, `/favorites`, `/profile/deals`).
- Money path is where polish is weakest (hardcoded copy + display bugs, §4, §7).

### 1.3 Seller
Create (`app/sell/new`) → publish (hard redirect, no success toast) → `/verkoper/dashboard` → `/verkoper/orders` → deal → delivery → complete → review → trust.
- Status logic string-matches Dutch labels (`order.status === 'Bevestigd'`) → locale-fragile; raw status shown to user; `innerHTML` toast.

### 1.4 REQUEST / community
`/?chip=gezocht` → `/request/[slug]` (**re-exports `ListingDetailPage`**) → proposal (primary CTA correct) → deal → CommunityOrder → agenda → delivery → complete → trust.
- Functionally complete (parity with sale), but **visually framed as a sale** (reviews block, stock/VAT/quantity chrome show on a *wanted* item).

### 1.5 Courier
`/delivery/signup` → `/delivery/dashboard` (`DeliveryDashboard.tsx`) → community requests → claim → deliver → complete → review → earnings (`/verdiensten`).
- Good status/earnings cards; but bottom nav hidden on `/delivery/*` (no back-to-app), `formatCurrency` diverges from the rest of the app, magic-number payout share.

### 1.6 Operations hub (all roles)
`/profile/deals` = cockpit (next agreement + next action) → Actie vereist → filters → agenda buckets (Vandaag…Historie) → courier strip → history.
- **Reference-quality**: fully i18n, single refresh path, consistent hierarchy. Only micro-nits (double status chip, duplicate chat link).

---

## 2. Onderzoek 1 — Eerste indruk (first impression)

| Question | Finding | Evidence |
|---|---|---|
| Understands HomeCheff in 30s? | Partial. Hero subtitle lists *categories*, not the core "digitaal dorpsplein / koop én verkoop lokaal" value. The clearest tagline is login+desktop-only. | `homePhase1.heroSubtitle` (nl.json:7404); `homeDorpsplein.sidebarTagline` only in `HomeDesktopSidebar.tsx:49` |
| More than meals? | Yes on desktop (7 category chips + vertical strip), **no on mobile** (chips are `hidden lg:block`). | `HERO_CHIP_KEYS` `HomeHeroSection.tsx:15-23,210,244` |
| Buy and offer? | Offer = clear (`share`/`earn`/`create` panels). **Buy = only implied** ("Ontdek/Bekijk…"); no buyer-side panel. | `guestSalesPanels.discover` nl.json:7445-7448 |
| What is "Gezocht"? | **Not explained to guests.** Only a feed chip label + "coming soon" mentions elsewhere. | `marketplace.discovery.requests.chip` nl.json:7882; `guestBottomNav.earn.bullet4` "Binnenkort ook hulp & klusjes" |
| What is "Community"? | Partial, desktop+login-only (`homeDorpsplein.communityCard*`, `guestBottomNav.reputation`). | `HomeDesktopSidebar.tsx:133-149` |

**Information overload (desktop above the fold):** hero stacks ~5 text tiers + ~13 clickable/visual tokens (eyebrow, H1, subtitle, 7 chips, 2 CTAs, orbit of 6 satellites, 3-item platform strip) before the feed, then a 3-column grid whose right rail is ~10 stacked cards for logged-in users. **Four overlapping chip systems** with no stated relationship: hero categories (Eten/Tuin/Creaties…) vs vertical strip (HomeCheff/HomeGarden/HomeDesigner) vs feed view-mode (Te koop/Inspiratie/Gezocht) vs scope (Dichtbij/Landelijk/Internationaal).

---

## 3. Onderzoek 2-6 — Journey frictions (buyer / seller / request / courier / ops)

### 3.1 Buyer
| # | Friction | Location | Quick win |
|---|---|---|---|
| B1 | Cart shows literal **`van Verkoper`** instead of seller name (item carries `sellerName`) | `components/cart/CartDrawer.tsx:147-149` | render `{item.sellerName}` |
| B2 | Order confirmation shows **`Product ID: clx9v…`** instead of product title | `app/payment/success/page.tsx:339` | resolve titles from polled order |
| B3 | CartDrawer, payment-success, checkout order-summary largely **hardcoded Dutch** | `CartDrawer.tsx:77-220`, `payment/success:188-354`, `checkout/page.tsx:1167-1266` | route through existing `cart.*`/`checkout.*` keys |
| B4 | Checkout validation uses blocking **`alert()`** | `app/checkout/page.tsx:611,620,625,712` | inline field errors |
| B5 | Two "Add to cart" CTAs visible at once on short mobile detail | `ProductSaleCommerceZone.tsx:268-282` + `ProductSaleStickyCta.tsx` | hide in-zone CTA when sticky active |
| B6 | Stepper asymmetry ("Stap 1" address, no "Stap 2" on delivery options) | `app/checkout/page.tsx:817,897` | add matching step label or drop prefix |
| B7 | `console.log` debug in buyer path; review link uses raw product id not slug | `app/orders/page.tsx:72-104,369` | strip logs; use `buildProductSlugPath` |

### 3.2 Seller
| # | Friction | Location | Quick win |
|---|---|---|---|
| S1 | Status buckets string-match Dutch labels (`=== 'Bevestigd'`) → breaks on EN/raw | `verkoper/dashboard/page-client.tsx:563,601`; `verkoper/orders/page-client.tsx:560,569,590` | branch on `statusRaw` enum |
| S2 | Raw status shown to user (`{order.status}`) while `getStatusText()` exists | `verkoper/dashboard/page-client.tsx:605,806` | wrap in `getStatusText()` |
| S3 | Success feedback via raw `innerHTML` DOM injection, hardcoded Dutch | `verkoper/orders/page-client.tsx:272-303` | use toast component + `t()` |
| S4 | Misleading `deliveryFee || 300` fallback (invents €3,00) | `verkoper/dashboard/page-client.tsx:1021` | show "—" when unknown |
| S5 | No explicit "gepubliceerd!" confirmation (implied by redirect) | `app/sell/new/page.tsx:304-306` | success toast on landing |
| S6 | Mixed hardcoded/translated tab labels (`'Nieuw'`, `'Lopend'`, `'Terugbetaald'`) | `verkoper/orders/page-client.tsx:198,344-345` | add `seller.*` keys |

### 3.3 REQUEST / community
| # | Friction | Location | Quick win |
|---|---|---|---|
| R1 | Request detail inherits **Reviews** block from sale detail (reviews on a *wanted* item) | `app/request/[slug]/page.tsx:1` → `ListingDetailPage.tsx:837-892`; flag `isRequestListing` exists `:664` | hide reviews when request |
| R2 | Sale chrome (stock badge, "Prijs incl. btw", quantity) shows on requests | `ProductSaleCommerceZone.tsx:126-147,195` | suppress for `listingKind === 'REQUEST'` |
| R3 | Sticky CTA can fall back to add-to-cart/"view offer" for a request without chat channel | `ProductSaleStickyCta.tsx:83-88,206-232` | for REQUEST, always route to proposal |
| R4 | CTA correct but understated; no request-specific framing line | `resolve-detail-actions.ts:34-56` | add request hero line |

The community loop **closes** (proposal→deal→delivery→review→trust→discovery); the gaps are visual framing, not missing steps.

### 3.4 Courier
| # | Friction | Location | Quick win |
|---|---|---|---|
| C1 | `formatCurrency` treats amounts as euros while seller/orders divides by 100 → 100× risk | `DeliveryDashboard.tsx:418-424` vs `verkoper/orders:226-230` | standardize one cents-based helper |
| C2 | Manual pluralization (`language === 'en' ? 's' : 'en'`) | `DeliveryDashboard.tsx:1046-1049` | use `t()` count-plural |
| C3 | Current-order badge re-implements status ternary, omits `CANCELLED` | `DeliveryDashboard.tsx:880-883` (vs `getStatusLabel` :434) | reuse `getStatusLabel` |
| C4 | Payout share is bare magic number `* 0.88`, 12% cut unexplained | `DeliveryDashboard.tsx:838-840` | "na servicekosten" caption |
| C5 | No back-to-app affordance (bottom nav hidden on `/delivery/*`) | `lib/bottomNavRoutes.ts`, `DeliveryDashboard.tsx:504-529` | persistent "Terug naar HomeCheff" link |
| C6 | `console.log` in Stripe onboarding path | `DeliveryDashboard.tsx:454-474` | strip |

### 3.5 Operations hub (micro-nits on an otherwise reference surface)
| # | Friction | Location | Quick win |
|---|---|---|---|
| O1 | Double status chip (hub card + `ProfileDealCard` both render it) | `AgreementHubDealCard.tsx:26-28` + `ProfileDealCard.tsx:227-229` | drop one |
| O2 | Kind-chip color differs deal (emerald) vs proposal (indigo) | `AgreementHubDealCard.tsx:23`, `AgreementHubProposalCard.tsx:25` | align styling |
| O3 | Proposal card has two chat entry points a few px apart | `AgreementHubProposalCard.tsx:52-66` | keep primary CTA only |
| O4 | Cockpit "next action" concatenates verb + title without hierarchy | `ProfileDealsClient.tsx:193-195` | bold action, muted title |

---

## 4. Onderzoek 7 — UI consistency

- **Design system barely adopted.** `components/ui/*` has 26 files; only `Button` (33 files) and `EmptyState` (1 file) are imported elsewhere. `HcButton`, `HcCard`, `Card`, `Tag`, `Input`, `HcInput`, `HcTextarea`, `ChipToggle`, `LoadingSkeleton` = **0 external imports** (dead). ~250 files hand-roll `<button>`.
- **Three primary-green tokens** for the same CTA role: `bg-primary-brand` (33), `bg-primary-600` (17), `bg-emerald-600` (~120). Even the *shared* `EmptyState` CTA uses `bg-emerald-600` (`EmptyState.tsx:43`), off the canonical `Button` token (`primary-brand`, `Button.tsx:14`).
- **Border-radius drift within a single journey:** detail CTA `rounded-2xl` → orders CTA `rounded-xl` → filter chips `rounded-lg` → deal-card CTA `rounded-lg`.
- **Status pills reimplemented ≥6×** with conflicting colors (Delivered = `bg-green-100` in orders/admin, `bg-green-50 border` in notifications, `bg-emerald-50 border` in deal card; Refunded = `orange` seller vs `gray` admin). Shared `OperationsStatusChips` is scoped to ops only; `Tag` is unused. Refs: `app/orders/page.tsx:110`, `verkoper/orders:166`, `verkoper/dashboard:258`, `admin/OrderManagement.tsx:217,596`, `notifications/OrdersTab.tsx:81`, `ProfileDealCard.tsx:54`.
- **Loading:** shared `RouteLoadingSkeletons` wired to 5 routes; **profile deals & delivery dashboard fall back to bare spinners**; buyer orders hand-rolls its own skeleton; `components/ui/LoadingSkeleton.tsx` unused.
- **Errors:** no toast library; **~240 `alert()`** across ~60 files is the de-facto channel (`ChatBox`, `StartChatButton`, `FavoriteButton`, `BottomNavigation` ×17, `checkout`). `app/error.tsx` + `MessagesErrorBoundary` exist but no shared inline "fetch failed / retry".
- **Touch/hover:** photo-uploader delete buttons are `w-6 h-6` (24px) and `opacity-0 group-hover:opacity-100` with no tap fallback in 8+ components (`ProductPhotoUpload.tsx:277`, `MultiImageUploader.tsx:308`, `RecipePhotoUpload.tsx:282`, `GardenPhotoUpload.tsx:263`, `DesignPhotoUpload.tsx:256`, `PhotoCarousel.tsx:354-380`). Good pattern already exists (`ProfileV2VehiclePhotos.tsx:272` uses `sm:opacity-0`), so it's fixable by copy.

---

## 5. Onderzoek 8 — Copy & terminology

- **NL/EN structural parity is perfect** (7358 leaf keys each, identical top-level namespaces, 0 orphan keys, 0 placeholder-token mismatches). Content parity weaker: ~5 clearly-untranslated values (`faq.emailUs`="E-mail ons" in EN; `register.vatPlaceholder` English in NL; `upload.uploadFailedForFile` Dutch in EN) + 579 identical values (mostly legit cognates).
- **P0 interpolation bug (verified):** `t()` uses `value.replace(/\{(\w+)\}/g, …)` (`hooks/useTranslation.ts:693`) — single brace only. **61 keys use `{{ }}`**, concentrated in trust cues: `marketplace.detail.trust.completedDeals`="{{count}} afgeronde afspraken" (en.json:7777), `marketplace.tile.trust.*`, `marketplace.preview.trust.*`, `marketplace.priceDisplay.*`, `marketplace.deals.delivery.*`, `proposal.notifications.*.body`, `trust.deals.with`, `growth.surfaces.*`. These render with stray braces (`{5} afgeronde afspraken`).
- **Copy bug (verified):** `admin.overview` = **"Aboutview"** and `admin.orderManagementDescription` = "Aboutview and management or all orders" (botched Over→About find/replace) (en.json:869).
- **Terminology drift in copy:** NL "afspraak" → EN "deal"/"agreement"/"arrangement" — *within* `marketplace.deals.*` (`markComplete`="Mark deal complete" vs `cancel`="Cancel agreement"). NL "bezorger" → EN "courier"/"deliverer"/"delivery". Buyer list is "aankopen" vs "bestellingen" (`emptyState.ordersTitle` "Nog geen bestellingen" vs `ordersDesc` "Je aankopen verschijnen hier…").
- **Dev terms in UI copy:** "listing" left untranslated in NL (`marketplace.agreements.empty`="…via een listing of chat"), "checkout" in NL (`communityOrder.checkoutForbidden`), "feed" in NL (`ecosystemHub.ctaFeed`). Raw status enums rendered: `ConversationContextHeader.tsx:116` `· {order.status}`, `verkoper/dashboard:605,806`, `admin/OrderManagement.tsx:481`.
- **Capitalization drift:** "Dorpsplein" (27) vs "dorpsplein" (47).
- **`t('key') || 'Dutch fallback'` anti-pattern** is pervasive in `DeliveryDashboard.tsx` and seller deliveries — because `t()` returns `''` for missing keys, the Dutch literal shows to English users.

---

## 6. Onderzoek 9 — Interaction audit

- **Hover-only controls** (uploader deletes, `PhotoCarousel` arrows, bottom-nav tooltips) have no touch equivalent → invisible/unreachable on mobile.
- **`alert()`-driven feedback** blocks the UI and reads as unfinished, especially in the quick-add flow (`BottomNavigation.tsx` ×17) and checkout.
- **Cart interaction split** (Phase-1 finding, still true): desktop drawer vs mobile `/checkout` navigation — two mental models.
- **Deep links / back nav** generally fine (soft-gate preserves `returnUrl`/`callbackUrl`; `pushAndroidBackHandler` handles quick-add back). No new breakage found.

---

## 7. Onderzoek 10 — Information architecture (Phase-3 additions)

Phase 1 covered route/component duplication. New journey-level IA notes:
- **`/favorites` is a Fans/follows page**, not saved products (`app/favorites/page.tsx` → `FansAndFollowsList`), while product favorites live in **two** `FavoritesGrid.tsx` files — a name↔content mismatch that will confuse users navigating from the new "Favorieten" nav entries.
- **Reviews framing lives on the wrong kind of listing** (request inherits sale reviews).
- **Trust cues** are well-placed (tile/detail) but broken by the `{{ }}` bug, so the payoff is invisible at exactly the discovery moment.
- **Delivery earnings** live off-area in `/verdiensten`; the courier dashboard has no path back to the main app.

---

## 8. Onderzoek 11 — Visual polish opportunities

- Reconcile the **three primary greens** and **radius scale** onto the `Button`/token system (biggest single perceived-quality lift).
- **Homepage density:** the desktop hero + 4 chip systems + ~10-card right rail compete; consider (recommendation only) demoting the orbit/platform-strip or merging the overlapping chip taxonomies. Mobile is lean but *too* lean (loses the "more than meals" chips).
- **Status chips:** one shared pill + one status→tone map would make buyer/seller/admin/ops look like one product.
- **Deal cards:** remove the stacked double status chip; align kind-chip colors.
- **Skeletons everywhere** (profile deals, delivery, buyer orders) instead of bare spinners.

---

## 9. Mobile vs desktop findings

| Area | Desktop | Mobile |
|---|---|---|
| Home hero | Full (chips, orbit, platform strip, tagline) | Stripped to H1+subtitle+2 CTAs — loses "more than meals" & community messaging |
| Notifications | `NotificationBell` | Now in mobile menu (Phase 2) ✅ |
| Cart | Drawer | Navigates to `/checkout` — different model |
| Back-office / finance | Desktop tables | Overflow (Phase-1 M1) |
| Courier | Dashboard | No bottom nav / back-to-app |
| Uploader controls | Hover reveal OK | Hover-only → unreachable |

---

## 10. What still feels unfinished (Onderzoek 12)

1. **The moment of payment** (checkout → success): hardcoded Dutch + `Product ID:` + `van Verkoper`.
2. **Trust numbers rendering with stray braces** on tiles/detail.
3. **Every status pill looking slightly different** between buyer/seller/admin.
4. **`alert()` popups** for errors/validation.
5. **`/favorites` showing fans**, not favorites.
6. **Request pages dressed as sale pages** (reviews, stock, VAT).

---

## 11. Design-consistency scorecard

| Dimension | State | Note |
|---|---|---|
| Buttons | ⚠️ | 1 adopted primitive, ~250 raw; 3 primary tokens |
| Cards | ⚠️ | `Card`/`HcCard` unused; bespoke cards everywhere |
| Badges/status | ❌ | ≥6 reimplementations, conflicting colors |
| Spacing/radius | ⚠️ | `rounded-lg/xl/2xl` mixed per journey |
| Typography | ✅ | broadly consistent hero/section classes |
| Icons | ✅ | `lucide-react` used consistently |
| Loading | ⚠️ | skeletons on 5 routes, spinners elsewhere |
| Empty states | ⚠️ | shared `EmptyState` used once; some hardcoded |
| Error states | ❌ | ~240 `alert()`, no shared inline/toast error |
| Touch targets | ⚠️ | 24px hover-only controls in uploaders |
| i18n | ⚠️/❌ | perfect parity structurally; `{{ }}` bug + hardcoded money screens |

---

## 12. What HomeCheff does well (keep)

- Operations hub (`/profile/deals`) — hierarchy, single refresh path, full i18n.
- Soft-auth gates with contextual copy + preserved intent.
- Home feed empty states (multi-variant, i18n, actionable).
- Route-level skeletons for the highest-traffic routes.
- Consistent `lucide-react` iconography and mobile-first consumer flows.

---

## 13. Prioritized friction register (P0–P3)

**P0 = user-visible broken · P1 = high "one product" impact · P2 = medium · P3 = polish.**

| ID | Friction | Location | Prio | Recommended fix |
|----|----------|----------|------|-----------------|
| J1 | `{{ }}` interpolation renders stray braces in trust cues | `useTranslation.ts:693` + 61 keys | **P0** | Support `{{x}}` in `t()` (or migrate keys to `{x}`) |
| J2 | Cart shows `van Verkoper` | `CartDrawer.tsx:147` | **P1** | render `item.sellerName` |
| J3 | Success page shows `Product ID: <cuid>` | `payment/success:339` | **P1** | show product title |
| J4 | Money-path hardcoded Dutch (checkout summary, success, cart) | `checkout:1167-1266`, `payment/success`, `CartDrawer` | **P1** | route via `t()` |
| J5 | `admin.overview` = "Aboutview" | en.json:869 | **P1** | fix to "Overview" |
| J6 | Seller status buckets match Dutch labels | `verkoper/*:560-601` | **P1** | branch on enum |
| J7 | Only 1 adopted button primitive; 3 primary tokens; ~250 raw buttons | app-wide | **P1** | pick one primitive/token; codemod incrementally |
| J8 | First-impression: no "buy+sell/what is HomeCheff" line; "Gezocht" unexplained; mobile loses chips | homepage | **P1** | add persistent one-liner; guest REQUEST panel; keep key chips on mobile |
| J9 | Status pills reimplemented ≥6× with conflicting colors | orders/seller/admin/notifications/deal-card | **P2** | shared `Tag` + status→tone map |
| J10 | `alert()` as error/validation channel (~240) | app-wide | **P2** | shared inline error / toast, start with checkout |
| J11 | Raw status enums shown to users | `ConversationContextHeader:116`, `verkoper/dashboard:605,806` | **P2** | map to translated label |
| J12 | Request pages show sale chrome (reviews/stock/VAT/quantity) | `request/[slug]` → `ListingDetailPage`/`ProductSaleCommerceZone` | **P2** | gate on `isRequestListing` |
| J13 | Bare spinners (profile deals, delivery, buyer orders) | `ProfileDealsClient:291`, `DeliveryDashboard:489`, `orders:223` | **P2** | reuse shared skeletons |
| J14 | Hover-only, 24px uploader controls, no tap fallback | 8+ uploader components | **P2** | copy `sm:opacity-0` pattern + 44px targets |
| J15 | `/favorites` is a Fans page (name↔content mismatch) | `app/favorites/page.tsx` | **P2** | clarify labels / align route to product favorites |
| J16 | Courier `formatCurrency` diverges (100× risk); magic payout share | `DeliveryDashboard:418-424,838` | **P2** | one cents helper; caption the cut |
| J17 | Terminology drift in copy (afspraak/deal/agreement; bezorger/courier; aankopen/bestellingen) | i18n values | **P2** | pick canonical EN terms per concept |
| J18 | `t('key') || 'Dutch'` fallbacks show Dutch to EN users | `DeliveryDashboard`, seller deliveries | **P2** | ensure keys, drop literal fallbacks |
| J19 | Seller success feedback via `innerHTML` | `verkoper/orders:272-303` | **P3** | toast component |
| J20 | Double status chip on hub deal card | `AgreementHubDealCard:26` + `ProfileDealCard:227` | **P3** | drop one |
| J21 | Duplicate chat link on proposal card; kind-chip color mismatch | `AgreementHubProposalCard:52-66,25` | **P3** | de-dup / align |
| J22 | Checkout stepper asymmetry; double mobile add-to-cart | `checkout:817,897`; `ProductSaleCommerceZone:268`+sticky | **P3** | label / hide-one |
| J23 | `console.log` in buyer/courier/seller prod paths | `orders:72-104`, `DeliveryDashboard:454-474` | **P3** | strip |
| J24 | "Dorpsplein" capitalization drift; misc long/jargony strings | i18n values | **P3** | normalize |
| J25 | No "gepubliceerd!" confirmation after create | `sell/new:304` | **P3** | success toast |
| J26 | `deliveryFee || 300` invents €3,00 | `verkoper/dashboard:1021` | **P3** | show "—" |

---

## 14. Quick wins vs bigger improvements

### Quick wins (low risk, high perceived-quality)
- **J1** support `{{ }}` in `t()` (one function; fixes all 61 trust-cue keys at once).
- **J2/J3** cart seller name + success product title (2 literals → real data).
- **J5** "Aboutview" → "Overview".
- **J20/J21/J23** de-dup hub chip + chat link; strip `console.log`.
- **J26/J25/J19** delivery-fee "—", create success toast, replace `innerHTML` toast.

### Medium (a few files each)
- **J4** money-path copy → `t()` (checkout summary, success, cart).
- **J6/J11** seller status by enum + translated labels.
- **J13** skeletons for profile deals / delivery / buyer orders.
- **J12** gate request chrome on `isRequestListing`.
- **J16/J18** courier currency helper + drop Dutch fallbacks.

### Bigger (cross-cutting, plan as tracks)
- **J7/J9** design-system consolidation: one button primitive + one token + shared status `Tag` (codemod, incremental).
- **J10** app-wide error/toast pattern replacing `alert()`.
- **J8** first-impression rework: persistent value line, guest REQUEST explanation, mobile chip retention.
- **J17** canonical terminology pass across copy.
- **J14** touch-target/hover-affordance pass on uploaders.

---

## 15. Recommended sequencing (post-audit, not part of this phase)

1. **UX-Fin 3a — Money-path polish (P0/P1):** J1, J2, J3, J4, J5, J6.
2. **UX-Fin 3b — Consistency pass (P2):** J9, J11, J13, J12, J16, J18.
3. **UX-Fin 3c — Interaction & touch (P2):** J10, J14, J15.
4. **UX-Fin 3d — Design system & terminology (bigger):** J7, J17.
5. **Housekeeping (P3):** J19–J26.

---

*Audit only — no code was modified. High-impact findings (J1 `{{ }}` bug, J5 "Aboutview", J2/J3 display bugs) were verified directly against source at time of writing. Component/route references are provided in lieu of screenshots (static trace).*
