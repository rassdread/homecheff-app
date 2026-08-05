# WX Phase 1C.2 — Available Space Messaging

**Phase:** 1C.2  
**Nature:** Presentation-only Orientation Strip enhancement  
**Date:** 2026-08-05

## Verdict

`WX_PHASE_1C_2_AVAILABLE_SPACE_PASS` (pending Production browser proof after deploy)

## Principle

AvailableSpace (usable width × height) drives message density.  
Meaning stays complete on every screen. Landscape stays compact (1B.4).

## Levels

| Level | Typical AvailableSpace | Chrome |
| --- | --- | --- |
| `ultra_compact` | Short landscape | Tight |
| `compact_complete` | Small portrait | Balanced |
| `standard_complete` | Tall portrait phones | Balanced |
| `expanded` | Tablet-scale portrait | Open |
| `rich` | Wide + tall | Open |

## Files

- `lib/adaptive-workspace-react/resolve-orientation-explanation.ts`
- `components/adaptive-workspace/WorkspaceOrientationStrip.tsx`
- `app/globals.css`
- `public/i18n/en.json` / `nl.json`
- `lib/adaptive-workspace-react/tests/run-orientation-explanation-tests.ts`
- `scripts/probe-wx-phase1c2-available-space-messaging.mjs`

## Scope

- No legacy marketing hero
- No Workspace architecture / GeoFeed ownership / payment / delivery / SEO / DB / env changes
