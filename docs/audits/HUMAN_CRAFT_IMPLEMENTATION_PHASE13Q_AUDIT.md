# Phase 13Q — Human Craft Authority & Mission Implementation Audit

**Date:** 2026-07-11  
**Scope:** Implementation verification against Phase 13P (approved P0/P1) and Phase 13O truth boundaries.  
**Method:** Code review, copy audit, schema inspection, consistency pass.

---

## Executive summary

Phase 13Q implements the **human-craft authority layer** HomeCheff lacked after Phase 13P. A single platform definition now drives metadata, FAQ JSON-LD, homepage schema, and About pages. **Seven pillar pages** provide legitimate, user-helpful content — not keyword doorways. **Misleading claims** (discovery boost, premium analytics, GDPR export completeness, €2k cap enforcement) are softened or clarified.

**Remaining gaps:** Food-heavy long-tail SEO landings (P2), public impact metrics (P2), full EN city copy (P3), paid boost wiring (product P0, separate track).

---

# Part 1 — Unified platform identity

| Surface | Before | After | Status |
|---------|--------|-------|--------|
| Root layout metadata | “Digitale Ateliers, Tuinen en Keukens” | `platform-definition.ts` craft-first titles | ✅ |
| Homepage Organization schema | Generic handmade products fallback | Digital home of personal craftsmanship | ✅ |
| FAQ JSON-LD | Broad but inconsistent first answer | Uses `faqWhatIsHomeCheff` from SSOT | ✅ |
| FAQ layout meta | Food-first description | Craft-first from SSOT | ✅ |
| About layout meta | Generic contact description | `organizationDescription` + `entityDefinition` | ✅ |
| OpenGraph | Food-leaning | Aligned via SSOT | ✅ |
| Footer | Unchanged tagline | Company line retained | ⚠️ Optional pillar link via SEO hub |

**Canonical entity (NL):**  
*HomeCheff is het digitale thuis van persoonlijk vakmanschap en lokale kansen.*

**SSOT:** `lib/seo/platform-definition.ts`

---

# Part 2 — Platform language

| Area | Change |
|------|--------|
| Product metadata | Seller name in title; “persoonlijk vakmanschap van een echte maker” |
| City pages | “vakmanschap en buurtaanbod”; person central |
| Business DNA i18n | “makers/buren” over “feed visibility” |
| Pricing tiers (`lib/pricing.ts`) | Removed discovery-boost / premium analytics feature bullets |
| FAQ JSON-LD | “verkopersprofiel” → “profiel” |

**Not changed (usability):** “Dorpsplein”, “checkout”, product tiles — task-oriented labels retained.

---

# Part 3 — Human-first SEO pillars

| Route | Intent | Doorway risk | Internal links |
|-------|--------|--------------|----------------|
| `/wat-is-homecheff` | What is HomeCheff? | Low — canonical definition | 7 pillars + FAQ |
| `/persoonlijk-vakmanschap` | Craft breadth | Low — educational | Cross-pillar |
| `/ontmoet-de-maker` | Profile-first discovery | Low — links to feed + ecosystems | Cross-pillar |
| `/lokaal-verdienen` | Honest income | Low — fees disclosed, no guarantees | Sell + bijverdienen |
| `/buurthulp` | Requests + services | Low — links to Gezocht chip | FAQ |
| `/buurt-economie` | Barter/community | Low — no fake impact numbers | Community hub |
| `/wat-we-niet-zijn` | Mass-production boundary | Low — policy-aligned | Anti-dropshipping pages |

All pages: NL+EN i18n via `pillarPageSources.ts`, FAQ block, CTA to register/home.

---

# Part 4 — Profile authority

| Item | Implementation |
|------|----------------|
| JSON-LD | `ProfilePage` with `mainEntity` Person |
| Bio in schema | Up to 300 chars when public |
| Image | Profile image when available |
| UI | Existing `PublicProfileClient` unchanged — schema upgrade only |

**Future (P2):** Profile meta title “{name} — maker in {city}”.

---

# Part 5 — Structured data

| Type | Where | Notes |
|------|-------|-------|
| `Organization` | Homepage | SSOT description |
| `WebSite` + `SearchAction` | Homepage | Place-based search template |
| `ProfilePage` | User profiles | New |
| `Service` | PRACTICAL_SERVICE, KNOWLEDGE listings | Via `buildListingJsonLd` |
| `Product` | Other listings | Unchanged type, maker in seller |
| `HowTo` | `/lokaal-verdienen` | 5 seller steps |
| `FAQPage` | Each pillar | 3 shared Q&As |
| `WebPage` | Pillars, city hubs | Standard |

**No fabricated ratings** — unchanged policy; only real reviews.

---

# Part 6 — Internal linking

```
/wat-is-homecheff (hub)
├── /persoonlijk-vakmanschap
├── /ontmoet-de-maker
├── /lokaal-verdienen
├── /buurthulp
├── /buurt-economie
└── /wat-we-niet-zijn

/seo-hub → pillar section (new, first)
/maaltijden/{stad} → /ontmoet-de-maker, /wat-is-homecheff
Each pillar → linkRow to all pillars + About + FAQ
```

---

# Part 7 — Misleading claims removed/softened

| Claim | Action | Evidence |
|-------|--------|----------|
| Discovery boost in ranking | Softened to “business badge, no ranking boost” | Phase 13O P0-3 |
| Premium analytics | “Verkopersoverzicht (geen premium analytics-module)” | Phase 13O P1-9 |
| GDPR full export | “Wordt nog uitgerold” | Phase 13O P0-1 |
| €2,000 cap enforced | “Richtlijn, niet automatisch afgedwongen” | Phase 13O P1-4 |
| Social impact metrics | “Geen kilo’s / eenzaamheid gemeten” on `/buurt-economie` | Phase 13O Part 12 |

**Still present (acceptable):** Fee percentages (code-backed), affiliate commission (code-backed), HCP leaderboards (exists, neutral description).

---

# Part 8 — City strategy

| Rule | Implementation |
|------|----------------|
| Min 3 active creators (7d) | `CITY_INDEX_MIN_ACTIVE_CREATORS` |
| Min 8 new listings+inspiration (7d) | `CITY_INDEX_MIN_NEW_ACTIVITY` |
| Sparse geo signal | `sparseGeoSignal` → noindex |
| Empty doorway pages | Not created |

**Pilot:** Vlaardingen indexed when thresholds met; sparse cities noindex automatically.

---

# Part 9 — AI discoverability

LLMs crawling updated surfaces should now extract **one consistent definition** from:

- `/wat-is-homecheff`
- Root metadata
- FAQ JSON-LD
- `platform-definition.ts` (if indexed via pages)

**English craft wording:** “personal craftsmanship”, “real people”, “food is one category”.

---

# Part 10 — Content governance

Implemented in `lib/seo/content-governance.ts`:

- 10 governance rules
- 9-item quality checklist
- Blocked claim patterns for future CI/editorial use

---

# Part 11 — Final consistency audit

## Aligned with Phase 13O

| Principle | Status |
|-----------|--------|
| No false discovery boost | ✅ Copy fixed; code wiring still separate task |
| No false GDPR export | ✅ |
| No false analytics | ✅ |
| No invented impact | ✅ |
| Honest fees | ✅ |

## Aligned with Phase 13P

| P0/P1 item | Status |
|------------|--------|
| O-01 Platform identity | ✅ |
| O-02 Discovery claims | ✅ Copy |
| O-03 GDPR/safety copy | ✅ |
| O-04 Earn locally pillar | ✅ |
| O-05 Meet the maker | ✅ |
| O-06 Personal craft | ✅ |
| O-07 Neighbour help | ✅ |
| O-08 Mass-production boundary | ✅ |
| O-09 Service vs Product schema | ✅ |
| City noindex | ✅ |

## Remaining inconsistencies (documented, not blocking)

| Item | Priority | Notes |
|------|----------|-------|
| 20 food-heavy SEO landings | P2 | Body copy still food-skewed; hub now craft-first |
| `gemeenschap` JSON-LD hardcoded NL | P2 | Page meta is bilingual |
| `/pricing` NL-only | P2 | |
| `business.dna` preview score UI still shows “visibility” metaphor | P2 | Labels softened; score is informational |
| Bottom nav “Snel Geld Verdienen” | P2 | Transactional tone |
| Food sell city pages (`/eten-verkopen-*`) | P2 | Intentional food wedge |

## Founder philosophy check

| Message | Visible? |
|---------|----------|
| Real people | ✅ Pillars, profiles, product meta |
| Real craftsmanship | ✅ SSOT + `/persoonlijk-vakmanschap` |
| Local opportunity | ✅ `/lokaal-verdienen` |
| Neighbours | ✅ `/buurthulp`, `/buurt-economie` |
| Honest earning | ✅ Fee disclosure, no guarantees |
| Reduce waste | ⚠️ Mentioned honestly, not claimed as measured |
| Strengthen communities | ✅ Mission copy, no fake metrics |
| Technology respects time | ⚠️ Not new public page (Phase 13O evidence internal) |

---

## Verdict

Phase 13Q successfully implements **approved P0 and P1** from Phase 13P within Phase 13O truth limits. HomeCheff’s public identity is now **coherent and craft-first** at the entity level, with **useful pillar content** and **honest claims**. SEO growth no longer outruns product truth for the implemented surfaces.

**Next recommended phase:** P2 food-landing paragraph alignment + Schiedam pilot city when data thresholds met.

---

*End of Phase 13Q implementation audit.*
