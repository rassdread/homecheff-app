# UX Finalization — Phase 11A Release Candidate (RC1)

**Date:** 2026-07-08

## Goal

Final acceptance audit before the first city pilot. Walk every user journey as if launching tomorrow. Fix only pilot-quality issues. Freeze architecture from Phases 7A–10E.

## Delivered

| Artifact | Purpose |
|----------|---------|
| `docs/audits/RELEASE_CANDIDATE_PHASE11A_AUDIT.md` | Full RC1 audit with P0–P3 classification |
| `scripts/validate-release-candidate-phase11a.ts` | Chains 7A–10E validators + RC guards |
| `components/feed/FeedMobileFilterSheet.tsx` | Mobile category filter parity fix |

## Key fix

**Mobile filter Services category (P1)** — The mobile filter sheet hardcoded only cheff / garden / designer options. Desktop sidebar and GeoFeed chips already used `DISCOVERY_CATEGORY_CHIP_OPTIONS` from `canonical-model.ts`. Mobile users could not filter the Services category from the filter sheet.

Fix: import `DISCOVERY_CATEGORY_CHIP_OPTIONS` and render options the same way as `FeedSidebarFilters`.

## Architecture

No changes to:
- `canonical-model.ts`
- `settlement-options.ts` / `settlement-router.ts`
- Taxonomy SSOT, tile pipeline, proposal pipeline
- Reverse discovery, filter persistence

## Validation

```bash
npx tsx scripts/validate-release-candidate-phase11a.ts
npm run lint
npm run smoke-check
npm run build
```

## Verdict

**HomeCheff Release Candidate RC1 is approved for the first city pilot.**

No P0 issues remain. P2 items (secondary “te koop” copy, owner-panel hardcoded Dutch, production backfill ops) are deferred post-pilot.

## Deferred (post-pilot)

- Onboarding hint terminology (“te koop” → “aangeboden”)
- `PublicSellerProfileNew` / delivery profile i18n
- `MarketplaceHoverPreview` `aria-modal`
- Production canonical backfill write (10E — requires backup + confirmation)
- Dorpsplein/Inspiratie parallel filter stacks
- URL params for full filter share links
