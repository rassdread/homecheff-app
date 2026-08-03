# First-visitor understanding (Workspace header)

Restored adaptive onboarding copy in `WorkspaceOrientationStrip`.

## Density (AvailableSpace only)

| Level | Typical surface | Copy |
| --- | --- | --- |
| `short` | Phone portrait | Identity + one short action line |
| `compact` | Phone landscape | Identity + action verbs (single row) |
| `medium` | Tablet | Medium explanation + equal-weight actions |
| `full` | Laptop / desktop / ultrawide | Full explanation + actions |

Resolver: `lib/adaptive-workspace-react/resolve-orientation-explanation.ts` (presentation-only; not a planner).

## Probe (local AW ON)

All 7 viewports PASS with expected `data-wx-orientation-explain` levels. Strip ≤16% viewport. Create remains reachable. Continuity remount `0`.
