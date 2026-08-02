# WX Phase 1B.5.6 — Architecture

## Pipeline

```
AvailableSpace → Mode → Capability → Presentation → Assist Eligibility
  → Progressive Disclosure → Tool Action Presentation → Honesty Density
                                                              ↓
                                                 diagnostics-only attrs
                                                 (no compaction apply)
```

## Planner constraints

| Rule | Enforcement |
| --- | --- |
| Pure / sync / deterministic | `resolveHonestyDensity` — no I/O, no async |
| No DOM / CSS / UA / pixel reads | Forbidden source patterns + sealed flags |
| No layout / chrome / ownership changes | Layout only writes `data-*` diagnostics |
| Fail closed | Contract mismatch → `status=rejected`, density `UNKNOWN`, compact `NONE` |
| Allocation-light | Single pass over sealed surface ids |

## Sealed honesty surfaces

`stage` · `orientation` · `command` · `assist-primary` · `assist-secondary` · `tool` · `disclosure`

## Density / compact mapping (summary)

| Surface class | Typical density | Compact |
| --- | --- | --- |
| Stage primary | NORMAL | NONE |
| CORE chrome (orientation/command) | NORMAL / DENSE (heightDemoted) | NONE / RECOMMENDED (landscape) / REQUIRED (heightDemoted) |
| Assist hollow / future | SPARSE | NONE / OPTIONAL (heightDemoted) |
| Assist absent / suppressed | EMPTY | NONE |
| Tool reachable | SPARSE | NONE |
| Tool persistent (≥3) | DENSE | OPTIONAL / REQUIRED |
| Tool persistent (≥4) + heightDemoted | OVERFLOW | REQUIRED |
| Disclosure discoverable | SPARSE | NONE |
| Fail-closed | UNKNOWN | NONE |

## Layout diagnostics only

- `data-wx-phase=1b.5.6`
- `data-wx-honesty` / `-version` / `-token` / `-status`
- `data-wx-density` · `data-wx-compact`
- `data-wx-honesty-renders=0` · `drives-chrome=0` · `applies-compaction=0`
- Aggregate id lists: empty / sparse / normal / dense / overflow / unknown / compact-*
