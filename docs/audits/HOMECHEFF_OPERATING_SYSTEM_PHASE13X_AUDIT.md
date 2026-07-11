# HomeCheff Operating System Phase 13X Audit

**Phase:** 13X — Operating System, Governance & Decision Framework  
**Last reviewed:** 2026-07-11  
**Status:** Implemented

## Part 1 — Purpose

Constitutional layer above software — governs every future decision for founders, team, moderators, developers, AI, partners, investors and franchisees.

## Part 2 — SSOT

`lib/governance/homecheff-operating-system.ts`:

| Export | Content |
|--------|---------|
| `DECISION_FRAMEWORK_STRENGTHENS` | 7 pillars |
| `FEATURE_ACCEPTANCE_CRITERIA` | 6 acceptance rules |
| `FEATURE_REJECT_EXAMPLES` | 7 reject patterns |
| `AI_CHARTER_ALLOWED` / `FORBIDDEN` | 5 + 5 |
| `GROWTH_CHARTER_REJECT` / `ACCEPT` | 6 + 6 |
| `INVESTMENT_PRINCIPLE_QUESTIONS` | 4 questions |
| `MODERATION_PRINCIPLE_KEYS` | 7 principles |
| `GOVERNANCE_PIPELINE_STAGES` | idea → evidence |
| `CULTURE_SUCCESS_DIMENSIONS` | internal success metrics |
| `FUTURE_DIRECTION_ASPIRATIONS` | 25-year direction (aspirational) |

Manifest (`/manifest`) remains philosophical SSOT; Constitution adds governance charters.

## Part 3 — Public route

`/constitution` — all Parts 1–10 as sections with FAQ and authority links.

## Part 4 — Integration

- Footer, SEO hub, Manifest, docs hub, principles, trust, living platform authority links
- i18n merge, sitemap, metadata builder

## Part 5 — Truth boundaries

Phase 13O: no hype, no guaranteed income, no measured impact claims on aspirations, no founder worship.

## Part 6 — Validation

```bash
npx tsx scripts/validate-homecheff-operating-system-phase13x.ts
npm run lint
npm run build
```
