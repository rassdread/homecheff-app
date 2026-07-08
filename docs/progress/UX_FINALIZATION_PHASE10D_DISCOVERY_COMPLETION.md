# UX Finalization — Phase 10D Discovery Completion

**Date:** 2026-07-08

## Goal

Complete canonical marketplace migration: every listing behaves consistently in discovery, reverse-discovery and value-economy. Filter state persists across navigation. No redesign.

## Delivered

| Artifact | Purpose |
|----------|---------|
| `lib/feed/home-filter-persist.ts` | Home filter snapshot SSOT (persist + migrate) |
| `scripts/audit-marketplace-discovery-completion-phase10d.ts` | Data + reverse-discovery audit |
| `scripts/validate-marketplace-discovery-completion-phase10d.ts` | Static + scenario guards |
| `docs/audits/MARKETPLACE_DISCOVERY_COMPLETION_PHASE10D_AUDIT.md` | Full audit |

## Key fixes

1. **Filter persistence** — `discoveryDirection` + `acceptedValues` saved in `hc_feed_surfaces_v2`
2. **UI consistency** — GeoFeed inline panel matches sidebar (accepted values always visible)
3. **Mobile scope** — scope toggle added to mobile filter sheet
4. **Clear filters** — resets discovery direction to `want`

## Data migration

Reuse Phase 10C backfill (unchanged):

```bash
npx tsx scripts/backfill-marketplace-data-normalization-phase10c.ts --dry-run
CONFIRM_BACKFILL=1 npx tsx scripts/backfill-marketplace-data-normalization-phase10c.ts --write
```

## Validation

```bash
npx tsx scripts/audit-marketplace-discovery-completion-phase10d.ts
npx tsx scripts/validate-marketplace-discovery-completion-phase10d.ts
npm run lint
npm run build
```

## Deferred

- Dorpsplein/Inspiratie parallel filter stacks
- URL params for full filter share links
- Server-side services vertical filter
