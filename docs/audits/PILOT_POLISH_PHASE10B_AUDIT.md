# Pilot Polish — Phase 10B Audit

**Date:** 2026-07-08  
**Scope:** Final UX polish before first city pilot. No redesign, no new architecture.  
**Builds on:** Phase 10A audit P2 items + consistency sweep.

---

## Executive summary

Phase 10B resolves all Phase 10A P2 findings and applies targeted consistency polish across guest flows, mobile/desktop, settlement wording, terminology, Stripe guidance, navigation semantics, accessibility, and SEO.

**Verdict:** **Pilot-ready** — one coherent product voice, no duplicate CTAs or Connect banners, architecture unchanged.

---

## 1. Phase 10A P2 resolution

| ID | Finding | Resolution |
|----|---------|------------|
| G1 | Guest favorites empty list | Login CTA + benefits + continue browsing (`FansAndFollowsList`) |
| B2 | Mobile detail duplicate CTAs | Removed `lg:hidden` inline `ProductSalePrimaryActions`; sticky only on mobile |
| S2 | Duplicate Stripe banner on edit | Removed `StripeConnectPaymentsBanner` from edit + sell/new; `SettlementConnectGuidance` only |
| — | Sitemap gaps | Added `/faq`, `/over-ons` to `sitemapXml.ts` |
| — | `gemeenschap` EN metadata | `resolvePageLanguage()` from cookie/header in `generateMetadata` |
| — | Terminology drift | `chipSale`, `saleViewOffer`, `putForSale`, discover fallback → Aangeboden/Offered |
| — | Settlement label mix | Unified to **Geaccepteerde waarden** / **Accepted values** on detail, preview, tile labels |

---

## 2. Guest experience

| Page | Guest state |
|------|-------------|
| Homepage / feed | Full browse; login for actions |
| Discovery / SEO | Public |
| FAQ / About | Public |
| Favorites | **Login CTA** with why + benefits (10B) |
| Messages | Login gate (existing) |
| Orders | Login gate + i18n (10A) |
| Checkout / proposals | Login required |

No silent empty screens on favorites.

---

## 3. Mobile polish

- **Detail:** Single dominant CTA via `ProductSaleStickyCta` (`lg:hidden`); desktop keeps sidebar actions.
- **Sticky scroll:** Scrolls to `#detail-settlement` when proposal/contact guidance needed.
- **Filter sheet:** Escape key + focus on open + `aria-modal` dialog (10B).
- **Safe areas:** Sticky CTA + bottom nav preserve `env(safe-area-inset-bottom)`.

---

## 4. Desktop polish

- Commerce zone: desktop-only primary actions in sidebar (`hidden lg:block`).
- Settlement + value sections in main column on mobile; sidebar on desktop (unchanged layout).

---

## 5. Settlement UX

Canonical label: **Geaccepteerde waarden** / **Accepted values**.

Aligned across:
- `marketplace.detail.settlement.acceptedValues`
- `marketplace.detail.acceptedValues.title`
- Preview/tile settlement row labels
- Reverse discovery filter heading

Removed mixed "Alternatieve tegenwaarden" / "Alternative values" / "counter-values" on primary settlement surfaces.

---

## 6. Marketplace terminology

| Before | After (View axis) |
|--------|-------------------|
| Te koop / For sale (chips) | Aangeboden / Offered |
| Te koop aanbieden | Aanbod plaatsen |
| Discover fallback "te koop" | "lokaal aanbod" / "local offers" |

"Te koop" retained only where literally about pricing context (e.g. barter-not-allowed on money-only listings).

---

## 7. Stripe Connect

Single guidance path: `SettlementConnectGuidance` inside `MarketplaceOfferForm`.

Removed duplicate `StripeConnectPaymentsBanner` from:
- `app/product/[id]/edit/page.tsx`
- `app/sell/new/page.tsx`

---

## 8. Navigation

- Bottom nav wrapped in `<nav aria-label={mainNavAria}>`.
- Discover tab: `aria-current="page"` when active.
- No new dead ends introduced.

---

## 9. Microcopy

Guest favorites hub keys added NL/EN. Settlement and view-axis terminology unified. Orders page i18n from 10A retained.

---

## 10. Accessibility

| Item | Status |
|------|--------|
| Bottom nav semantics | ✅ `<nav>` + aria-label |
| Filter sheet focus | ✅ Focus close button on open; Escape closes |
| Dialog semantics | ✅ `role="dialog"` `aria-modal` (existing, enhanced) |
| Sticky CTA touch targets | ✅ `min-h-[44px]` (existing) |

---

## 11. Performance

No new providers, fetches, or state. Mobile CTA removal reduces duplicate render path on detail.

---

## 12–14. Consistency / visual / pilot checklist

All journeys (guest, buyer, seller, Gezocht, services, value economy, checkout, messages, orders) complete without architecture changes. Visual system unchanged (design tokens 6A/6B).

---

## 15. Regression audit

| System | Status |
|--------|--------|
| Settlement router (8E) | ✅ Unchanged |
| Canonical model (7D) | ✅ Unchanged |
| Reverse discovery (8C) | ✅ Unchanged |
| Taxonomy SSOT | ✅ Unchanged |
| Brand / SEO (9A/9B) | ✅ Extended only (sitemap, gemeenschap meta) |
| CTA routing | ✅ Via settlement-router |

---

## Architecture confirmation

No new systems. All flows through existing canonical pipeline from Phases 7A–10A.
