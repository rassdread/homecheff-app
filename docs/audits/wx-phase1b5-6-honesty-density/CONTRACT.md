# WX Phase 1B.5.6 — Contract

| Field | Value |
| --- | --- |
| Contract ID | `wx-honesty-density-v1` |
| Version | `1.0.0` |
| Phase | `1b.5.6` |
| `diagnosticsOnly` | `true` |
| `drivesChrome` | `false` |
| `appliesCompaction` | `false` |
| `rendersDensityUi` | `false` |
| `visualActivationAuthorized` | `false` |
| `neverInspectDom` | `true` |
| `neverInspectCss` | `true` |
| `neverInspectUserAgent` | `true` |
| `neverRemount` | `true` |
| `neverTransferOwnership` | `true` |

## Density states

`UNKNOWN` · `EMPTY` · `SPARSE` · `NORMAL` · `DENSE` · `OVERFLOW`

## Compact states

`NONE` · `OPTIONAL` · `RECOMMENDED` · `REQUIRED`

## Entry fields (diagnostics)

`surfaceId` · `density` · `compactState` · `reason` · `confidence` · `renderAuthorized=false` · `compactionAuthorized=false`

## Fail-closed

Any registry / presentation / disclosure / tool-action contract mismatch, unknown honesty surface, duplicate honesty surface, or rejected upstream plan → plan `status=rejected`, every entry `density=UNKNOWN`, `compactState=NONE`, no render / no compaction authorization.
