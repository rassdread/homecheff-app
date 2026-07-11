# Machine Trust Phase 13V Audit

**Phase:** 13V — Machine Trust, Open Knowledge & AI Agent Readiness  
**Last reviewed:** 2026-07-11  
**Status:** Implemented

## Part 1 — Scope

Open Knowledge layer: public documentation, trust transparency, changelog, roadmap, principles, AI page, glossary, machine-readable schema (where truthful).

## Part 2 — Routes

| Path | Purpose |
|------|---------|
| `/docs` | Documentation hub (CollectionPage) |
| `/docs/ranking` | Feed ranking explainability |
| `/docs/business-dna` | Business subscription SSOT |
| `/docs/hcp` | HomeCheff Points |
| `/docs/affiliate` | Affiliate programme |
| `/docs/community-orders` | Community deals |
| `/docs/barter` | Barter / ruil |
| `/docs/delivery` | Local delivery |
| `/docs/marketplace` | Marketplace model |
| `/docs/trust` | Operational trust |
| `/docs/privacy` | Product privacy & export |
| `/docs/ai` | Technical AI documentation |
| `/docs/api` | Agent readiness (no fake API) |
| `/trust` | Public trust philosophy |
| `/changelog` | Factual changelog |
| `/roadmap` | Completed / in progress / planned / ideas |
| `/principles` | Open principles summary |
| `/ai` | Public AI page |
| `/glossary` | DefinedTermSet terminology |

## Part 3 — Explainability contract

Each `/docs/*` page includes: purpose, how it works, limitations, user impact, truth boundaries, FAQ (3), last reviewed.

## Part 4 — Truth boundaries (Phase 13O)

- Business DNA feed ranking boost: **not live** (`BUSINESS_DISCOVERY_RANKING_WIRED = false`)
- GDPR export: **live** at `GET /api/profile/export-data` with documented omissions
- Suspension: global mutation guard (Phase 13T)
- No public write API for agents
- No guaranteed income / discovery boost marketing

## Part 5 — Schema

- `CollectionPage` — `/docs`
- `TechArticle` — doc pages, `/trust`, `/changelog`, `/roadmap`, `/principles`, `/ai`
- `DefinedTermSet` + `DefinedTerm` — `/glossary`
- FAQPage via existing `SeoLandingTemplate` where FAQ blocks present

## Part 6 — Manifest alignment

All philosophy pages link to `/manifest` as SSOT. Principles page summarizes manifest values without duplicating full text.

## Part 7 — Validation

Run: `npx tsx scripts/validate-machine-trust-phase13v.ts`

Checks: routes, i18n completeness, glossary, sitemap, wiring, blocked claims, schema builders.
