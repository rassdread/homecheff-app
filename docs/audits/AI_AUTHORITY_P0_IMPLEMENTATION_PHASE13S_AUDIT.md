# Phase 13S — AI Authority P0 Implementation Audit

**Date:** 2026-07-11  
**Scope:** Implementation of Phase 13R P0 register (13R-01–13R-04) + corpus reconciliation + citation standards.  
**Truth boundary:** Phase 13O mandatory. No speculative AI tricks.

---

## Executive summary

Phase 13S delivers **factual competitor comparisons**, a **complete Organization knowledge graph SSOT**, **schema consolidation** in root layout, a **public ecosystem map**, and **food-page identity reconciliation** — all standards-based and product-backed.

**Before → after (sitemap):** 88 → **96 URLs**; craft/authority hubs 12 → **20** ( +1 ecosystem, +7 comparisons, pillar links updated). Food-skewed URL count unchanged (pages retained); **reconciliation blocks** added to food landings.

---

# Part 1 — Competitor comparison architecture

## Routes created

| Route | Competitor |
|-------|------------|
| `/vergelijken` | Hub |
| `/vergelijken/homecheff-vs-etsy` | Etsy |
| `/vergelijken/homecheff-vs-marktplaats` | Marktplaats |
| `/vergelijken/homecheff-vs-facebook-marketplace` | Facebook Marketplace |
| `/vergelijken/homecheff-vs-nextdoor` | Nextdoor |
| `/vergelijken/homecheff-vs-vinted` | Vinted |
| `/vergelijken/homecheff-vs-bezorgplatforms` | Thuisbezorgd / delivery apps |

## Framework

- **SSOT:** `lib/seo/comparison-pages.ts` + `lib/i18n/comparisonPageSources.ts`
- **UI:** `SeoLandingTemplate` `comparisonTable` block + `AuthorityLandingPage`
- **Structured data:** WebPage, FAQPage (visible FAQ), no Review schema
- **Last reviewed:** 2026-07-11 (visible)
- **NL/EN:** i18n merge via `translations.ts`

## Rules enforced

- Factual, respectful copy; “when alternative may fit better” sections
- No invented competitor prices/policies
- No “universally better” marketing claims
- Links to pillars, ecosystem map, platform definition

---

# Part 2 — Organization knowledge graph enrichment

## Implemented (`lib/seo/organization-identity.ts` + `schema-builders.ts`)

| Property | Status |
|----------|--------|
| `@id` (`/#organization`) | ✅ |
| `name` (HomeCheff) | ✅ |
| `alternateName` | ✅ |
| `url`, `logo`, `description` | ✅ |
| `sameAs` | ✅ `homecheff.eu`, `homecheff.nl` |
| `foundingLocation` / `address` (locality) | ✅ Vlaardingen |
| `contactPoint` | ✅ support@homecheff.eu |
| `parentOrganization` | ✅ Arrias Beheer B.V. (`/#legal-operator`) |
| `founder` Person | ✅ Sergio Arrias (name + jobTitle only) |
| `knowsAbout` | ✅ craft topics NL/EN |
| `areaServed` | ✅ Netherlands |
| `copyrightHolder` | ✅ `@id` reference |
| `legalName` on brand node | ❌ omitted — legal name on parent org |

## Deliberately omitted (unverified)

| Field | Reason |
|-------|--------|
| `foundingDate` | Not on About/legal pages |
| Street address | Only city published |
| Founder biography | Not on public About |
| Social `sameAs` | No verified official URLs in codebase |
| Wikidata/Wikipedia | Not created/verified |

## Pending `sameAs` verification

Documented in `PENDING_SAME_AS_VERIFICATION`: LinkedIn, Instagram, KvK profile URL, Wikidata, municipality partnership page.

---

# Part 3 — Schema SSOT consolidation

## Before

- Homepage inline Organization + WebSite (`HomePageClient.tsx`) with `/?q=` SearchAction
- `schema-builders.ts` minimal Organization; `/?place=` SearchAction
- Page-local publisher `{ name: 'HomeCheff' }` without `@id`

## After

- **`RootEntityGraphScripts`** in `app/layout.tsx` — single graph on all pages
- **`buildRootEntityGraphJsonLd()`** — Organization + legal operator + WebSite
- **Canonical SearchAction:** `/?place={search_term_string}#homecheff-feed`
- Homepage duplicate JSON-LD **removed**
- Pillars, food SEO, gemeenschap updated to `publisher` / `isPartOf` `@id` references

## Surfaces updated

| Surface | Change |
|---------|--------|
| Root layout | +RootEntityGraphScripts |
| HomePageClient | −inline Organization/WebSite |
| PillarLandingPage | WebPage via template + `@id` refs |
| HomecheffSeoLanding | `@id` publisher/isPartOf |
| gemeenschap | Language-aware WebPage + `@id` |
| ProfilePage | `@id` isPartOf/publisher (schema-builders) |

---

# Part 4 — Public ecosystem map

**Route:** `/hoe-homecheff-werkt`

Covers: Discovery, people/roles, value exchange, trust, HCP, Business DNA (with limitations), logistics, mission, local discovery, organization facts, glossary (Dorpsplein, Gezocht, HCP, Business DNA, community orders), FAQ, internal links (Vlaardingen, Rotterdam, comparisons, pillars).

**HCP / Business DNA honesty:** Explicit — HCP not cash; Business DNA does not guarantee feed ranking boost (Phase 13O).

---

# Part 5 — Corpus identity reconciliation

- **`FoodCategoryContextBlock`** + 3 i18n variants
- Auto-injected on **6 food programmatic namespaces** and **14 food SEO defs** (via `page.id` hash)
- Links to `/wat-is-homecheff` and `/hoe-homecheff-werkt`
- Does not rewrite food copy or URLs

## Sitemap balance

| Metric | Phase 13R | Phase 13S |
|--------|-----------|-----------|
| Total URLs | 88 | 96 |
| Craft/authority hubs (pillars + gemeenschap + ecosystem + comparisons) | ~12 | ~20 |
| Food-skewed paths (same methodology as 13R) | ~41 | ~41 |

**Remaining food-first retrieval risk:** High — volume unchanged; reconciliation adds cross-links and definitions, not new food URLs.

---

# Part 6 — Citation-ready content standard

Applied to comparison + ecosystem pages: direct intro answer, H1/H2, short sections, comparison table, plain FAQ, visible last reviewed, no emoji blocks, Phase 13O blocked patterns absent.

---

# Part 7 — Local AI readiness

Ecosystem map links `/maaltijden/vlaardingen`, `/maaltijden/rotterdam`. City noindex thresholds **unchanged** (`shouldIndexCityHub`). Schiedam not added (not in `LOCAL_SEO_CITIES`).

---

# Part 8 — External authority readiness

Organization facts block on ecosystem page (operator, KvK, contacts, categories, founder name with qualification). No fake press, awards, or user counts.

---

# Part 9 — Validation

| Check | Result |
|-------|--------|
| `validate-ai-authority-implementation-phase13s.ts` | Run after docs |
| `validate-ai-authority-phase13r.ts` | Updated for schema SSOT |
| lint | pass |
| smoke-check | run |
| build | pass |

---

# Opportunity register — remaining (from 13R)

| ID | Priority | Item |
|----|----------|------|
| 13R-05 | P1 | Expand FAQ JSON-LD (top 15 Q) |
| 13R-06 | P1 | EN dedicated routes for pillars (optional) |
| 13R-07 | P1 | Standalone Vlaardingen/pilot page when factual content ready |
| 13R-08 | P1 | Services/lessons explainer pillar |
| 13R-09 | P1 | — gemeenschap JSON-LD language **fixed in 13S** |
| 13R-10 | P2 | Food SEO intro refresh to SSOT |
| 13R-11 | P2 | Founder paragraph on About |
| 13R-12 | P2 | BreadcrumbList on all explainers |
| 13R-13 | P3 | Wikidata + press kit |

---

*Implementation complete. Safe to commit when validation passes.*
