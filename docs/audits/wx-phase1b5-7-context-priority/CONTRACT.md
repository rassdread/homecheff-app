# WX Phase 1B.5.7 — Contract

| Field | Value |
| --- | --- |
| Contract ID | `wx-context-priority-v1` |
| Version | `1.0.0` |
| Phase | `1b.5.7` |
| `diagnosticsOnly` | `true` |
| `drivesChrome` | `false` |
| `appliesOrdering` | `false` |
| `rendersPriorityUi` | `false` |
| `neverReorderSurfaces` | `true` |

## Priority levels

`UNKNOWN` · `LOW` · `NORMAL` · `HIGH` · `CRITICAL`

## Scores

UNKNOWN=0 · LOW=25 · NORMAL=50 · HIGH=75 · CRITICAL=100

## Fail-closed

Contract mismatch / unknown / duplicate / missing upstream → `priority=UNKNOWN`, `priorityScore=0`.
