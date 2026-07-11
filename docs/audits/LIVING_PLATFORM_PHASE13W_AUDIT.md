# Living Platform Phase 13W Audit

**Phase:** 13W — Living Platform, Evidence Layer & Real-World Authority  
**Last reviewed:** 2026-07-11  
**Status:** Implemented

## Part 1 — Philosophy

Show, don't tell. Evidence from live platform activity — no invented numbers, estimates, or marketing KPIs.

## Part 2 — Routes

| Path | Purpose |
|------|---------|
| `/evidence` | Live activity modules (7d window) |
| `/statistics` | Aggregate countable facts (Dataset schema) |
| `/stories` | Case study framework — empty until permission |
| `/timeline` | Shipped vs planned milestones |
| `/reports` | Transparency report slots — initially empty |
| `/how-homecheff-grows` | AI evidence: how public knowledge evolves |

## Part 3 — Data sources (SSOT)

`lib/living-platform/evidence-queries.ts`:

- `getPlatformStatistics()` — Prisma counts only
- `getEvidenceSnapshot()` — recent public listings, makers, cities (indexable only), categories
- `PUBLIC_DATASET_CATALOG` — future read-only dataset index

Reuses: `shouldIndexCityHub`, `getEcosystemHubForCitySlug`, `getCategoryEcosystem`.

## Part 4 — Governance

Evidence may display:

- Existing public platform data
- Verified aggregates without PII
- Documented behaviour

Never:

- Estimated impact / projected growth
- Investor metrics / internal dashboards
- Private transactions or messages

## Part 5 — Frameworks

- **Case studies:** `PUBLISHED_CASE_STUDIES` — empty array until real permission
- **Reports:** `TRANSPARENCY_REPORT_SLOTS` — 5 slots, all unpublished
- **Timeline:** `PLATFORM_TIMELINE` — planned items marked `kind: 'planned'`

## Part 6 — Schema

- `ItemList` — `/evidence`
- `Dataset` — `/statistics`
- `TechArticle` — stories, timeline, reports, how-homecheff-grows

## Part 7 — Authority graph

Connected via `AUTHORITY_HUB_LINKS` to Manifest, Open Knowledge, Trust, Glossary, etc.

## Part 8 — Validation

```bash
npx tsx scripts/validate-living-platform-phase13w.ts
npm run lint
npm run build
```
