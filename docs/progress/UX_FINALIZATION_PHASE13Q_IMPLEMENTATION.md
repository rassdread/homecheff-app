# UX Finalization — Phase 13Q: Human Craft Authority & Mission Implementation

**Status:** Complete  
**Date:** 2026-07-11

---

## Goal

Implement approved Phase 13P P0 and P1 recommendations while respecting Phase 13O truth boundaries. HomeCheff must present as **the digital home of personal craftsmanship** — not a food-only marketplace.

---

## What was implemented

### P0 — Identity & truth

| ID | Implementation |
|----|----------------|
| O-01 | `lib/seo/platform-definition.ts` SSOT; aligned root layout, FAQ JSON-LD/meta, About meta, homepage schema |
| O-02 | Softened Business DNA, pricing tier features, subscription copy — removed discovery-boost ranking claims |
| O-03 | GDPR export copy honest (rollout in progress); privacy portability text updated |

### P1 — Authority pillars

| ID | Route | Purpose |
|----|-------|---------|
| O-04 | `/lokaal-verdienen` | Earn locally — honest fees, HowTo schema |
| O-05 | `/ontmoet-de-maker` | Meet the maker |
| O-06 | `/persoonlijk-vakmanschap` | Personal craftsmanship |
| O-07 | `/buurthulp` | Neighbour help & services |
| O-08 | `/wat-we-niet-zijn` | Mass-production boundary |
| — | `/wat-is-homecheff` | Canonical platform definition |
| — | `/buurt-economie` | Community economy (honest impact) |

### Structured data

- `ProfilePage` on `/user/[username]`
- `Service` vs `Product` via `buildListingJsonLd`
- `HowTo` on `/lokaal-verdienen`
- `SearchAction` on homepage `WebSite` schema (existing, aligned)

### City strategy

- `shouldIndexCityHub()` — sparse cities get `noindex`
- City page copy + internal links to pillars

### Internal linking

- SEO hub pillar section (7 core topics)
- Pillar cross-links on every pillar page
- City pages link to `/ontmoet-de-maker` and `/wat-is-homecheff`

### Content governance

- `lib/seo/content-governance.ts` — rules + checklist + blocked claim patterns

---

## Files created

- `lib/seo/platform-definition.ts`
- `lib/seo/schema-builders.ts`
- `lib/seo/city-indexability.ts`
- `lib/seo/content-governance.ts`
- `lib/seo/pillar-pages.ts`
- `lib/seo/buildPillarMetadata.ts`
- `lib/i18n/pillarPageSources.ts`
- `components/seo/PillarLandingPage.tsx`
- 7 pillar routes under `app/*/page.tsx`
- `docs/audits/HUMAN_CRAFT_IMPLEMENTATION_PHASE13Q_AUDIT.md`
- `scripts/validate-human-craft-implementation-phase13q.ts`

## Files updated (highlights)

- `app/layout.tsx`, `app/faq/layout.tsx`, `app/over-ons/layout.tsx`
- `components/home/HomePageClient.tsx`, `components/seo/HomecheffSeoHub.tsx`
- `app/product/[id]/layout.tsx`, `app/user/[username]/page.tsx`
- `app/maaltijden/[stad]/page.tsx`, `lib/seo/sitemapXml.ts`
- `lib/seo/faqStructuredData.ts`, `lib/pricing.ts`, `app/pricing/page.tsx`
- `public/i18n/nl.json`, `public/i18n/en.json`, `lib/i18n/translations.ts`

---

## Deferred (P2+ from Phase 13P)

- Full EN city page i18n
- Public `/impact` page (no metrics yet)
- Food SEO landing paragraph refresh (14 pages)
- Schiedam in `LOCAL_SEO_CITIES`
- Wire paid boost OR keep copy soft (copy softened; wiring unchanged)

---

## Validation

```bash
npx tsx scripts/validate-human-craft-implementation-phase13q.ts
npm run lint
npm run build
```
