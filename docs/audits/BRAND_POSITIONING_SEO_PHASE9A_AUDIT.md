# Brand Positioning, SEO & Content Architecture — Phase 9A Audit

Date: 2026-07-08  
Scope: Pilot-launch readiness — audit every user-facing surface for brand/SEO alignment  
Prerequisites: Phases 7A–8E (marketplace architecture, settlement router, value economy) — **unchanged**

## Executive summary

HomeCheff has **two parallel brand stories** in production:

1. **Current product (aligned):** Root layout, `homePhase1`, canonical marketplace IA (Offered / Wanted / Inspiration + Food / Garden / Creations / Services), settlement router, discovery direction, value-economy copy.
2. **Legacy SEO & content (meal-skewed):** ~75% of programmatic SEO landings, city hubs under `/maaltijden/`, PWA manifest, FAQ opener, Organization JSON-LD, and several onboarding/success pages still frame HomeCheff as a **homemade meals / thuiskok / delivery-adjacent** platform.

**Pilot readiness:** The **in-app marketplace experience** reflects the broader local craft & exchange platform. **Crawler-facing and long-tail SEO** still over-index on food intent — intentional for traffic capture but **conflicts with brand positioning** if surfaced as the primary story.

**Phase 9A action:** Document and guard; fixes deferred to Phase 9B+ without marketplace architecture changes.

---

## Core positioning (target)

**NL:** Een lokaal platform waar mensen producten, diensten, vakmanschap, creativiteit en hulp aanbieden, verkopen, ruilen en met elkaar verbinden.

**EN:** A local craft, exchange and community platform.

**Never position as:** maaltijdsite, receptenplatform, food delivery app, kookplatform. Food is one vertical, not the platform identity.

---

## 1. Homepage audit

| Question | Status | Evidence |
|----------|--------|----------|
| What HomeCheff is | ✅ Partial | `homePhase1.heroDefinition` — eten, oogst, creaties, **diensten**, **hulp**, kopen/verkopen/**ruilen** |
| Why it exists | ⚠️ | FAQ `general.0` still food-waste / surplus meals mission |
| How it works | ✅ | `homePhase1.howItWorksStep1..3`, guest panels, ecosystem strip |
| Why different | ✅ | Value exchange, barter, Gezocht, settlement diversity in `guestSalesPanels` |
| How to earn | ✅ | `guestSalesPanels`, vertical cards (Chef/Garden/Designer) |
| How to sell | ✅ | CTA share, sell hub — but some copy says “te koop” |
| How to exchange | ✅ | Barter chips, accepted values, reverse discovery |
| How to help | ✅ | Services, neighbour help in hero chips |
| How to discover | ✅ | Dorpsplein feed, direction toggle, category chips |
| Community | ✅ | HCP, gemeenschap routes, trust blocks |

**Gaps:** Mobile hero is lean — full chip row `hidden lg:block`. Organization schema uses narrow `home.schemaOrganizationDescription` vs broader `homePhase1.schemaWebsiteDescription`.

---

## 2. Marketplace & discovery

| Surface | Status | Notes |
|---------|--------|-------|
| View chips (All / Offered / Wanted / Inspiration) | ✅ | `DISCOVERY_VIEW_CHIP_OPTIONS` → `marketplace.canonical.view.*` |
| Category chips | ✅ | Food / Garden / Creations / Services |
| Settlement display | ✅ | Phase 7C–8E — not a filter axis |
| Reverse discovery | ✅ | Phase 8C — offer mode, accepted values |
| Gezocht empty CTA | ✅ | Points to `marketplace.canonical.view.offered` |
| Feed intro | ✅ | `feed.chipSectionIntro` — offered/gezocht/inspiratie |
| Legacy `feed.chipSale` (“Te koop”) | ⚠️ | Key exists; not primary chip UI |

---

## 3. Product, service, request pages

| Surface | Status | Notes |
|---------|--------|-------|
| Product detail metadata | ✅ | Dynamic; “local makers” — category-agnostic |
| Product JSON-LD | ✅ | `Product` + `BreadcrumbList` + `Offer` |
| Settlement section | ✅ | Phase 7C/8E |
| Request (Gezocht) pages | ✅ | Proposal-first via settlement router |
| Service listings | ✅ | Same commerce stack; no kind-matrix CTAs |

---

## 4. Profiles, create, onboarding

| Surface | Status | Notes |
|---------|--------|-------|
| Public seller profile | ✅ | Multi-listing tiles |
| Create/edit form | ✅ | Intent + category + settlement booleans |
| `onboardingFlow` i18n | ✅ | Interests include help & delivery |
| `onboarding/buyer`, `onboarding/seller` | ❌ | Hardcoded Dutch; seller = “Eten” first |
| Kitchen form copy | ⚠️ | `profileV2.forms.chef` — “Maaltijd toevoegen” |
| Register | ⚠️ | `recipesAndDishes` — recipe-platform signal |

---

## 5. FAQ, about, help, footer

| Surface | Status | Notes |
|---------|--------|-------|
| FAQ `general.0` | ❌ | Handmade products + surplus meals — no services/wanted/barter |
| FAQ `localCommunity.*` | ✅ | Dorpsplein vs Inspiratie, local makers |
| FAQ JSON-LD (`faqStructuredData.ts`) | ⚠️ | Kitchen/garden/studio roles; no services/wanted/barter |
| About (`overOns`) | ⚠️ | Cooks/gardeners/designers + recipes — partial |
| Footer | ✅ | Neutral legal/links |
| Nav | ✅ | No legacy “Te koop” chips |

---

## 6. Authentication, emails, notifications

| Surface | Status | Notes |
|---------|--------|-------|
| Login/register i18n | ✅ | NL/EN |
| Verification email | ✅ | Neutral “Welcome to HomeCheff” |
| Order/payment emails | ⚠️ | Not fully audited; checkout copy is delivery-heavy |
| Push notifications | ⚠️ | Not audited in depth |

---

## 7. Checkout, chat, proposal

| Surface | Status | Notes |
|---------|--------|-------|
| Checkout copy | ✅ | Settlement-aware errors (contact/barter/payments) |
| Payment success | ✅ | `paymentSuccess.*` i18n |
| Legacy `/success` page | ❌ | Hardcoded Dutch |
| Chat / proposal | ✅ | Settlement labels from Phase 8E |

---

## 8. SEO metadata audit

### Root layout (`app/layout.tsx`) — ✅ aligned

| Lang | Title | Positioning |
|------|-------|-------------|
| NL | Ontdek Digitale **Ateliers, Tuinen en Keukens** | Broad |
| EN | Discover Digital **Studios, Gardens and Kitchens** | Broad |

**Residual:** Keywords still include `thuisgemaakte maaltijden`, `recepten`, `homemade meals`, `recipes`. OG image 192×192 (not 1200×630). No Twitter card on root.

### Meal-heavy surfaces — ❌ / ⚠️

| Surface | Issue |
|---------|-------|
| `lib/seo/homecheffSeoPages.data.ts` | 15/20 pages food-first titles (maaltijden, thuiskok, thuisgekookt) |
| `app/maaltijden/[stad]/page.tsx` | URL + H1 + meta = “Maaltijden in {city}” |
| `app/seo-hub/page.tsx` | Description: “thuisgekookt eten kopen, verkopen…” |
| `public/manifest.json` | “Thuisgemaakt. Thuisgebracht.” + `categories: ["food"]` |
| Programmatic food cluster | `/geld-verdienen-met-koken`, `/thuisgekookt-eten-verkopen`, etc. |

### Broader SEO surfaces — ✅

| Surface | Positioning |
|---------|-------------|
| `/gemeenschap/keuken|tuin|studio|inspiratie|community` | Ecosystem segments |
| `/lokale-producten-verkopen` | Garden |
| `/unieke-producten-verkopen` | Handmade |
| `/bijverdienen-vanuit-huis` | Chef / Garden / Designer |
| `/verdienen-zonder-dropshipping` | Multi-route earning |

---

## 9. Structured data (JSON-LD)

| Location | `@type` | Alignment |
|----------|---------|-----------|
| `HomePageClient.tsx` | `Organization` | ⚠️ Narrow — “handmade products” |
| `HomePageClient.tsx` | `WebSite` | ✅ Broader dorpsplein |
| `faqStructuredData.ts` | `FAQPage` | ⚠️ Kitchen/garden/studio; no barter/wanted |
| `faq/layout.tsx` | `FAQPage` | Server-injected |
| `product/[id]/layout.tsx` | `Product` | ✅ Commerce-ready |
| `seller/[sellerId]/layout.tsx` | `Person`/`Organization` | ✅ |
| `maaltijden/[stad]/page.tsx` | `WebPage` + `Place` | ❌ Meal-only |
| `gemeenschap/[segment]/page.tsx` | `WebPage` | ✅ |
| SEO landings | `WebPage` + `Article` | ⚠️ Meal pages included |

**Crawler gap:** Homepage JSON-LD injected client-side (`StructuredData.tsx` useEffect) — weaker than server-rendered FAQ/product schemas.

**Missing:** Marketplace-level `ItemList`, `Service` for chores, cross-route `WebSite` on non-home pages.

---

## 10. Technical SEO

| Element | Status | Notes |
|---------|--------|-------|
| Canonical domain | ✅ | `https://homecheff.eu` (`lib/seo/constants.ts`) |
| `robots.ts` | ✅ | Allow `/`, sitemap linked |
| `sitemap.xml` | ⚠️ | ~79 URLs; missing `/faq`, `/over-ons`, `/geld-verdienen-met-koken` |
| hreflang | ⚠️ | Cookie routes: NL+EN same URL; only `[seoSlug]` has true pairs |
| OpenGraph | ⚠️ | Inconsistent; root uses small icon |
| Twitter cards | ⚠️ | Missing on home, city hubs, ecosystem |
| Internal linking | ⚠️ | 3 parallel city URL patterns (cannibalization risk) |
| Duplicate titles | ⚠️ | `/maaltijden/rotterdam` vs `/maaltijden-in-rotterdam` |
| H1 hierarchy | ⚠️ | Not audited page-by-page |
| Image ALT | ⚠️ | Product pages dynamic; not fully audited |
| Lazy loading | ✅ | Standard Next/Image patterns |
| 404/500 | ⚠️ | Not audited in depth |

### Local SEO

| Element | Status |
|---------|--------|
| City pages (15) | ✅ `/maaltijden/{stad}` — meal-branded |
| City sell pages (4) | ✅ `/eten-verkopen-{stad}` |
| Ecosystem local stats | ✅ City pages link gemeenschap |
| `Place` schema | ✅ On city pages |
| Radius discovery | ✅ Feed geo filter |

---

## 11. Brand consistency — outdated wording inventory

### High priority (brand surface / install)

| Location | Outdated framing |
|----------|------------------|
| `public/manifest.json` | “Thuisgemaakt. Thuisgebracht.” |
| `home.schemaOrganizationDescription` | Sell handmade products only |
| `faq.general.0` | Surplus meals / food waste mission |
| `discover.hubSubtitle` | “te koop” / “for sale” |
| `app/onboarding/seller/page.tsx` | Meal-first hardcoded NL |

### Medium priority (SEO long-tail — may keep with reframe)

| Pattern | Count | Notes |
|---------|-------|-------|
| `maaltijd` in SEO titles | ~15 pages | Intent capture |
| `thuisgekookt` slugs | 3+ | Long-tail |
| `thuiskok` / `koken` | 5+ sell hub pages | Earning intent |
| `recept` / `recepten` | Root keywords, dorpsplein | Inspiration vertical |

### Low priority (in-app, context-appropriate)

| Location | Notes |
|----------|-------|
| `profileV2.forms.chef` | Kitchen vertical = meals OK |
| `RecipeManager` | Recipe context |
| Checkout delivery copy | Feature, not brand |

---

## 12. Content architecture

```
Home (/)
├── Dorpsplein feed (?chip=sale|gezocht|inspiration)
├── Discover hub
├── SEO hub (/seo-hub, /en/seo-hub)
│   ├── Food long-tail (20 slug pages)
│   └── Programmatic cluster (dropshipping, garden, handmade)
├── Ecosystem (/gemeenschap/{keuken|tuin|studio|inspiratie|community})
├── Local SEO (/maaltijden/{stad}, /eten-verkopen-{stad})
├── Commerce (/product/*, /request/*, /checkout)
├── Community (/messages, proposals, deals)
├── Trust (/faq, /over-ons, /terms, /privacy)
└── Seller (/sell, /verkoper/*)
```

**Gaps:** No SEO hub sections for tuin/studio/diensten/ruil. FAQ structure is food-heavy in `general`/`selling`/`buying`.

---

## 13. Marketplace terminology (Phase 7D)

| Axis | Canonical | Legacy (compat only) |
|------|-----------|----------------------|
| View | All / **Aangeboden** / Gezocht / Inspiratie | `sale`, `gezocht` chips |
| Category | Eten / Tuin / Creaties / Diensten | cheff, garden, designer |
| Settlement | HomeCheff Checkout / Direct / Barter / Values | `orderMethod` fallback |

**Violations found:** `discover.hubSubtitle` (“te koop”), `common.putForSale`, `feed.chipSale` key, EN `sell.freeBody` leaks “Gezocht” instead of “Wanted”.

---

## 14. Discovery philosophy & trust positioning

| Theme | In product | In SEO/FAQ |
|-------|------------|-------------|
| Not only money | ✅ Settlement row, value economy | ⚠️ SEO hub food-first |
| Exchange / barter | ✅ Chips, proposal flow | ⚠️ Rare in meta |
| Gezocht / wanted | ✅ First-class filter | ⚠️ Weak in FAQ |
| Local / community | ✅ Dorpsplein, HCP | ✅ Partial |
| Safe checkout | ✅ Phase 8E | ✅ Stripe in FAQ schema |
| Reputation | ✅ Trust tiles | ✅ |

---

## 15. NL/EN parity gaps

| Item | Gap |
|------|-----|
| `sell.freeBody` EN | “Gezocht” not “Wanted” |
| Onboarding buyer/seller | Dutch only |
| `app/success/page.tsx` | Dutch only |
| `gemeenschap/[segment]` metadata | `titleEn` defined but NL always emitted |
| `faq.general.*` | Parity ✅ but both outdated |

---

## 16. Architecture regression guard

Phase 9A makes **no changes** to:

- `lib/marketplace/canonical-model.ts`
- `lib/marketplace/settlement/settlement-router.ts`
- `lib/marketplace/settlement/settlement-options.ts`
- Feed ranking, tile pipeline, discovery filters

Validators 8E/8D/8C/7C must remain green.

---

## 17. Recommended Phase 9B priorities (deferred)

1. **Manifest + Organization schema** — align with root layout tagline  
2. **FAQ `general.0`** — rewrite to local craft & exchange platform  
3. **SEO hub restructure** — add Tuin/Studio/Diensten/Ruil sections; reframe “Eten kopen”  
4. **City URL strategy** — `/lokaal/{stad}` or multi-vertical titles under `/maaltijden/`  
5. **Sitemap expansion** — `/faq`, `/over-ons`, missing programmatic pages  
6. **Onboarding i18n** — buyer/seller pages  
7. **Retire hardcoded `/success`** — redirect to `paymentSuccess` i18n  
8. **Root OG/Twitter** — 1200×630 image + Twitter card  
9. **Server-side homepage JSON-LD**  
10. **Canonical “Aangeboden”** — replace user-facing “Te koop” where view-axis intended  

---

## Validation

```bash
npx tsx scripts/validate-brand-positioning-phase9a.ts
npx tsx scripts/validate-settlement-router-phase8e.ts
npx tsx scripts/validate-marketplace-value-economy-phase8d.ts
npx tsx scripts/validate-reverse-discovery-phase8c.ts
npm run lint
npm run build
```
