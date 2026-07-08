# Brand Implementation — Phase 9B Audit

Date: 2026-07-08  
Scope: Implement Phase 9A audit — brand copy, SEO, structured data, terminology  
Unchanged: Marketplace architecture Phases 7A–8E

## Executive summary

Phase 9B establishes HomeCheff's **definitive launch identity**: a local craft, exchange and community platform. Food remains a category and SEO entry point — not the platform definition.

**Deliverable:** `docs/brand/HOMECHEFF_BRAND_LANGUAGE.md` as single source of truth.

---

## 1. Brand language document

Created `docs/brand/HOMECHEFF_BRAND_LANGUAGE.md` with mission, vision, elevator pitch, NL/EN descriptions (web, app store, social, investor, press), IS/IS NOT, canonical terminology, tone of voice.

---

## 2. Old positioning removed

| Surface | Before | After |
|---------|--------|-------|
| FAQ `general.0` | Food waste / handmade sell-only | Full platform + value exchange |
| `home.schemaOrganizationDescription` | Sell handmade products | Craft, exchange, community |
| `discover.hubSubtitle` | “te koop” / “for sale” | “aangeboden” / “offered” |
| `manifest.json` | “Thuisgebracht” + food category | Dorpsplein multi-category |
| Onboarding seller | Meal-first hardcoded NL | i18n + 4 categories |
| `/success` | Hardcoded Dutch | `paymentSuccess` i18n |
| SEO hub intro | Food-first | Ecosystem-first framing |
| City pages H1/meta | “Maaltijden in …” | “Lokaal aanbod in …” (URL kept) |

---

## 3. New positioning applied

Aligned with brand language doc across FAQ, About, Organization schema (via i18n), WebSite schema description, FAQ JSON-LD, layout keywords (broad terms first), dorpsplein subtitles, register copy.

---

## 4. Homepage

`homePhase1.heroDefinition` already aligned (9A). Updated `schemaWebsiteDescription` and Organization description keys.

---

## 5. FAQ

Rewritten `general.0` and `general.1` (NL/EN). Updated `localCommunity.0` for offered terminology + barter/wanted.

---

## 6. About

Rewritten `whoWeAre`, `mission`, `whatWeDo` blocks (NL/EN) — craft, services, Gezocht, value exchange.

---

## 7. Manifest

Description + categories (`lifestyle`, `shopping`, `social`) — no food-only positioning.

---

## 8. Organization schema

`HomePageClient` reads `home.schemaOrganizationDescription` — now broad platform copy (NL/EN).

---

## 9. SEO metadata

- Root layout keywords reordered (marketplace/community before meal long-tail)
- `/seo-hub` NL/EN meta descriptions broadened
- `/maaltijden/[stad]` titles/descriptions/H1 broadened (URLs preserved)

---

## 10. SEO hub strategy

`HOMECHEFF_SEO_HUB_SECTIONS` reorganized:

1. Lokaal ontdekken & kopen (incl. food long-tail as subsection)
2. Eten & keuken (één categorie) — retained long-tail pages
3. Lokaal aanbieden & verdienen
4. Lokaal in jouw stad

Added ecosystem + FAQ + Gezocht internal links in `HomecheffSeoHub`.

**Food SEO pages not deleted** — repositioned under balanced hub.

---

## 11. Local SEO strategy

`/maaltijden/{stad}` URLs unchanged for SEO value. Titles/H1/copy broadened to “Lokaal aanbod”. JSON-LD `WebPage` name updated. Links to gemeenschap/keuken retained.

---

## 12. Structured data

`faqStructuredData.ts` — platform-level FAQ JSON-LD includes services, value exchange, proposals. No fake schema added.

---

## 13. Internal linking

SEO hub footer: Dorpsplein, Gezocht, Aanbieden, FAQ, Over ons. Ecosystem section: keuken/tuin/studio/inspiratie/community.

---

## 14. Canonical terminology

“Te koop” → “aangeboden” on discover hub. EN `sell.freeBody` “Gezocht” → “Wanted”. View/category/settlement axes unchanged (7D).

---

## 15. NL/EN parity

New `onboardingBranch.*` keys NL/EN. All updated FAQ/About/schema keys paired.

---

## 16. Architecture non-regression

No changes to `canonical-model`, `settlement-router`, reverse discovery, feed ranking, or CTA routing.

---

## 17. Deferred

- Individual SEO landing page body copy (20 slug pages) — titles remain food long-tail by design
- Full FAQ category rewrites (selling/buying NVWA blocks) — food-legal context retained
- Server-side homepage JSON-LD
- Root OG 1200×630 image
- Sitemap expansion (`/faq`, `/over-ons`)
- `gemeenschap` metadata EN locale fix
- User-facing sweep of all `putForSale` / `te koop` keys in forms

---

## Validation

```bash
npx tsx scripts/validate-brand-implementation-phase9b.ts
npx tsx scripts/validate-brand-positioning-phase9a.ts
npx tsx scripts/validate-settlement-router-phase8e.ts
npx tsx scripts/validate-marketplace-value-economy-phase8d.ts
npx tsx scripts/validate-reverse-discovery-phase8c.ts
npm run lint
npm run build
```
