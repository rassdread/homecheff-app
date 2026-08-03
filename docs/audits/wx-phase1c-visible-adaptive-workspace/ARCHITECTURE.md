# WX Phase 1C — Architecture

**Phase:** Visible Adaptive Workspace Completion & Launch Readiness  
**Baseline:** Production freeze WX Phase 1B.5.9 (`afeaa867`)  
**Contract:** `wx-visible-adaptive-workspace-v1`  
**Branch:** `wx/phase-1c-visible-adaptive-workspace`

## Mission

Convert the frozen planner stack into a **visible** adaptive Workspace experience without extending planners, transferring ownership, or inventing new renderers / hosts / scroll systems.

## Authority chain (unchanged)

```
AvailableSpace
  → resolveFeedWorkspaceVisibleLayout   (rails / grid — existing)
  → resolveLandscapeWorkPosture         (chrome posture — existing 1B.4)
  → resolveVisibleAdaptiveWorkspace     (1C consumer — presentation only)
  → Mode → Capability → Presentation → … → Intent   (diagnostics only)
```

GeoFeed remains sole owner of request / cache / pagination / filters / observers / scroll / render.

## What 1C adds

| Piece | Role |
| --- | --- |
| `resolveVisibleAdaptiveWorkspace` | Pure consumer of layout + posture → chrome insets, density, rail-filter ownership, scroll owner, interaction priority |
| `WorkspaceFeedPresentationBridge` | Portal host for start-rail filters + surfacePlan read model for end rail |
| Shell height adaptive inset | Landscape reclaim of bottom-nav reserve (`bottomRem = 0`) |
| Stage-compact discovery chrome | When start rail owns filters, primary keeps chips/count only |

## What 1C does **not** do

- No new Mode / Capability / Presentation / Assist / Disclosure / Tool / Honesty / Priority / Relevance / Intent planners
- No Host `ACTIVE`
- No second feed owner
- No UA / device branching
- No Formal Review / Merge / Deploy / Freeze

## Continuity

Permanent slots (`orientation` / `start` / `primary` / `end`) unchanged. Primary never keyed by Mode/posture/visible plan. Rotation remount = 0 (browser-proven).
