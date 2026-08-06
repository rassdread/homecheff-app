# Discovery continuity — executive summary

**Verdict:** `HOMECHEFF_DISCOVERY_CONTINUITY_PASS`  
**Gate:** `READY_FOR_FORMAL_REVIEW`  
**Branch:** `fix/feed-composition-progressive-discovery`  
**Status:** Feature-complete on branch — not merged / not deployed / not frozen unless explicitly requested.

## Product contract

Exact matches always first → honest band + CTA when empty/sparse → normal mixed discovery continues underneath. Never a dead empty page that replaces HomeCheff while discovery candidates exist. Never require clearing filters to browse again.

## What changed

| Area | Change |
|------|--------|
| Policy | `lib/feed/discovery-continuity.ts` — constraint detection, sparse threshold (5), band/feed gates, id dedupe |
| UI | `DiscoveryContinuityBand` — contextual empty/sparse copy + create / Gezocht / trade / invite CTAs |
| GeoFeed | Unconstrained progressive sale + Inspiration continuity pool; layout order exact → band → continuity; exclusive empties blocked when band applies |
| i18n | EN/NL continuity keys |
| Contract | Continuity section in `homecheff-feed-composition-contract.md` |
| Tests | `npm run test:discovery-continuity` (18/18) |

## Behaviour examples

- Search “Sushi”, 1 nearby → show 1 → band → continue mixed discovery (deduped).
- Search “Pottery”, 0 nearby → band (“no pottery nearby yet”) → continue discovery.
- Category with 3 matches → show 3 → continue (band if sparse).

## Validators

```text
npm run test:discovery-continuity   # 18/18
npm run test:feed-composition-progressive  # 23/23 (unchanged contract)
```

## Out of scope / not claimed

- Formal Review, merge to main, production deploy, freeze.
- Interactive Safari / Android device proof of the continuity band (code + static validators only).
