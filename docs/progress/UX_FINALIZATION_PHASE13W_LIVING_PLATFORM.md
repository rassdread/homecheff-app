# UX Finalization — Phase 13W Living Platform

**Status:** Complete  
**Last reviewed:** 2026-07-11

## Goal

Shift from explaining to proving — living evidence from real platform activity, connected to Open Knowledge and Manifest.

## Delivered

### Evidence layer

- `/evidence` — dashboard modules (makers, listings, inspiration, Gezocht, barter, cities, categories, delivery count, community orders 7d)
- `/statistics` — 11 measurable facts in honest table (Dataset JSON-LD)
- Live Prisma queries with `revalidate = 300`

### Frameworks (empty until data)

- `/stories` — case study framework, `PUBLISHED_CASE_STUDIES = []`
- `/reports` — 5 transparency report slots, all unpublished
- `/timeline` — shipped vs planned milestones

### AI evidence

- `/how-homecheff-grows` — features, docs, truth boundaries, evidence generation

### Architecture

- `lib/living-platform/registry.ts` — routes, timeline, reports, authority links
- `lib/living-platform/evidence-queries.ts` — query SSOT
- `PUBLIC_DATASET_CATALOG` for future read-only exports

### Integration

- i18n merge, sitemap (6 paths), footer, `/docs` hub links
- City hubs link to `/evidence`
- Sparse-city rules preserved in evidence city module

## Truth preserved

- Phase 13O blocked claims avoided
- No fictional stories or reports
- Zero counts displayed honestly
- Business subscriptions: active + `endsAt > now`

## Validation

```bash
npx tsx scripts/validate-living-platform-phase13w.ts
npm run lint
npm run build
```

## Next (optional)

- First permission-verified community story
- First quarterly transparency report when data pipeline ready
- Public read API for aggregated statistics (after security review)
