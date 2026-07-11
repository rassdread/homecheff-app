# Phase 13R — AI Authority, Generative Search & Knowledge Graph

**Status:** Audit complete (no implementation)  
**Date:** 2026-07-11  
**Audit:** `docs/audits/AI_AUTHORITY_PHASE13R_AUDIT.md`  
**Validator:** `scripts/validate-ai-authority-phase13r.ts`

---

## Goal

Transform understanding of how LLM-based search (ChatGPT, Gemini, Claude, Perplexity, Copilot) would describe, recommend and cite HomeCheff — and identify standards-based gaps without speculative hacks.

**Prerequisite:** Phases 13N–13Q complete. This phase does not re-open instant experience, ethical product, semantic SEO audit, or human craft implementation.

---

## Deliverables

| Deliverable | Path | Status |
|-------------|------|--------|
| Audit (10 parts + opportunity register) | `docs/audits/AI_AUTHORITY_PHASE13R_AUDIT.md` | ✅ |
| Progress tracker | `docs/progress/UX_FINALIZATION_PHASE13R_AI_AUTHORITY.md` | ✅ |
| Validator script | `scripts/validate-ai-authority-phase13r.ts` | ✅ |

---

## Executive outcome

| Area | Verdict |
|------|---------|
| **ChatGPT-style description** | Likely **local food + neighbourhood marketplace** with **secondary** craft/help/barter signals — pillars improved definition but **food corpus still ~3× craft hubs** in sitemap |
| **Knowledge graph** | **Partial** — core types exist; missing `sameAs`, `legalName`, founder, founding metadata; schema split across implementations |
| **Generative search** | Pillars answer core “what/who/earn/craft/help” — **no named competitor answers** |
| **Citation readiness** | Strong on SSOT + pillars; weak on full FAQ verbosity and seller/product meta |
| **Ecosystem semantics** | Product-unified; **AI-readable graph incomplete** for HCP, DNA, community orders, delivery, affiliate |
| **Authority** | Legal + policies adequate; **no third-party corroboration** in markup |
| **Local discovery** | Strong for **homemade food** queries; weak for **gardener / tutor / generic earn** unless brand-known |
| **Founder philosophy** | Use where product-backed (13O); do not amplify unmeasured impact or unwired subscription boosts |

---

## Part checklist

| Part | Topic | Key finding |
|------|-------|-------------|
| 1 | ChatGPT description | Food-heavy indexed corpus outweighs craft SSOT for retrieval |
| 2 | Knowledge graph | 12/20 schema properties partial or missing |
| 3 | Generative search | 11/15 example questions answerable; 5 competitor questions not |
| 4 | AI citation | Pillars ✅; FAQ page ❌ citation-friendly |
| 5 | Semantic relationships | UI unified; public explainers fragmented |
| 6 | Authority signals | Policies strong; founder/external proof weak |
| 7 | Content gaps | P0: competitor pages, ecosystem map, legal schema, corpus balance |
| 8 | AI memory strategy | SSOT + pillars good foundation; need graph enrichment + corpus balance |
| 9 | Local AI discovery | Food yes; gardener/tutor/generic earn unlikely |
| 10 | Founder philosophy | Strengthens where product proves it; pitch noindex limits founder citations |

---

## Top opportunities (from audit register)

### P0

- **13R-01** — Factual competitor comparison pages (Etsy, Marktplaats, Facebook Marketplace, Nextdoor, Vinted, delivery apps)
- **13R-02** — Organization JSON-LD: `legalName`, `foundingLocation`, `contactPoint`, `sameAs`
- **13R-03** — Consolidate schema to `lib/seo/schema-builders.ts` (homepage + About)
- **13R-04** — Public ecosystem map (HCP, Business DNA, community orders, delivery, affiliate)

### P1

- **13R-05** — Expand FAQ JSON-LD (top 15, plain text)
- **13R-06** — EN pillar parity
- **13R-07** — Factual Vlaardingen / pilot locality page
- **13R-08** — Services & lessons explainer
- **13R-09** — Fix `gemeenschap` JSON-LD language

### P2 / P3

- Food SEO corpus refresh (deferred from 13Q)
- Founder factual About paragraph
- Breadcrumbs on explainers
- Wikidata / press kit (long-term)

---

## Validation

Run after audit deliverables:

```bash
npx tsx scripts/validate-ai-authority-phase13r.ts
npm run lint
npm run build
```

| Check | Result |
|-------|--------|
| Validator | **65/65** pass |
| Lint | pass |
| Build | pass |

---

## What was explicitly not done

- No product or schema implementation
- No revisiting Phase 13N–13Q scope
- No marketing copy changes
- No LLM manipulation tactics

---

## Next phase suggestion

**Phase 13S (if approved):** Implement P0 register items only — competitor comparisons, Organization graph enrichment, schema SSOT wiring, ecosystem map page — with Phase 13O truth boundary and content governance checks.

---

*Audit-only phase. Implementation requires explicit approval.*
