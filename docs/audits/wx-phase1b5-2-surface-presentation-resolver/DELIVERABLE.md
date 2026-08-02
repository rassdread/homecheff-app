# WX Phase 1B.5.2 — Surface Presentation Resolver

**Status:** `READY_FOR_FORMAL_REVIEW`  
**Verdict:** `WX_PHASE_1B5_2_PASS`

| Ref | Value |
| --- | --- |
| Branch | `wx/phase-1b5-2-surface-presentation-resolver` |
| Worktree | `/Users/sergioarrias/homecheff-wx-1b52-impl` |
| Base / rollback | `7fd6e4b7b40c2684c6c3cae017ce1cbbbfaefc01` (Production 1B.5.1 tip) |
| Contract | `wx-surface-presentation-resolver-v1` · plan `wx-surface-presentation-plan-v1` · version `1.0.0` |
| Phase marker | `1b.5.2` |
| Commit A (impl) | `e2ef2f697c9d7aa690850acdedb3d48f17a20b74` |
| Commit B (evidence) | `5eef2b91c9b46765f5b9b809b26e33fc8e97af8b` |

**Not claimed:** merge · deploy · Production freeze · WX Phase 1B.5.3

---

## 1. Executive Summary

Phase 1B.5.2 seals a pure, deterministic Surface Presentation Resolver that consumes AvailableSpace-derived Mode, Capability Plan, and posture to emit a Surface Presentation Plan (eligibility + priority under contention). Prioritisation is first-class inside the resolver. Diagnostics expose the plan on the Workspace shell. Chrome occupancy, visual activation, remount, and ownership are unchanged — presentation does **not** drive chrome (`drivesChrome=false`).

## 2. Resolver Specification

| Input | Source |
| --- | --- |
| Registry contract id/version | Sealed 1B.5.1 registry |
| Capability contract id | Sealed 1B.3 framework |
| Mode / posture / floors | Mode Engine plan |
| Capability activation map | Capability Framework plan |
| Landscape carve-out / height demotion | Mode plan |

| Output | Meaning |
| --- | --- |
| `presentationState` | absent / reachable / persistent / compacted / reserved-blocked |
| `eligible` | persistent or compacted only (plan-only; not render auth) |
| `orderedSurfaceIds` | priorityRank ↑ then registry index ↑ |
| `stabilityToken` | deterministic identity of ordered states |
| `drivesChrome` | always `false` in this phase |

Assist capacity: Browse 0 · Compact (+carve-out) ≤1 · Hybrid ≤1 · Full/Professional ≤2 when panels available. Reserved registry truth overrides capability spoofing. Fail-closed on invalid Mode/posture/contracts/unknown/duplicate surfaces.

## 3. Diagnostics Summary

Workspace shell exposes:

- `data-wx-phase=1b.5.2`
- `data-wx-presentation` / `data-wx-presentation-plan` / `data-wx-presentation-version`
- `data-wx-presentation-token` / `data-wx-presentation-status`
- `data-wx-presentation-drives-chrome=0`
- `data-wx-presentation-eligible` / `suppressed` / `reserved` / `ordered`
- `data-wx-cap-visual-activation=0` (unchanged)
- `data-wx-continuity-remount=0` (unchanged)

## 4. Contract Tests

`npm run test:surface-presentation-1b52` — **22/22** assertions (vectors, priority, reserved, fail-closed, purity, diagnostics seals).

## 5. Browser Proof

Production-build local proof: **10/10 PASS** + cross-Mode journey PASS (`WX_PHASE_1B5_2_BROWSER_PROOF_PASS`).  
Artifacts: `browser-proof.json` · `cross-mode-journey.json`

## 6. Responsive Proof

Viewports 320, 390, 740×360, 844×390, 768, 1024, 1280, 1440, 1920, 2560: presentation contract/version present; `drives-chrome=0`; no new surface UI; no horizontal overflow; mount remount diagnostic `0`.

## 7. Regression Matrix

| Suite | Result |
| --- | --- |
| surface-presentation-1b52 | PASS |
| surface-registry-1b51 | PASS |
| workspace-capability-framework | PASS |
| workspace-mode-engine | PASS |
| transition-continuity | PASS |
| mobile-landscape-scroll | PASS |
| landscape-work-posture | PASS |
| nav-preservation-1b4 | PASS |
| adaptive-workspace-react | PASS |
| adaptive-workspace | PASS |
| adaptive-workspace-feed-sealed | PASS |
| chrome occupancy | PASS |
| lint | PASS |
| smoke-check | PASS |
| production build | PASS |

## 8. Ownership Verification

GeoFeed · Controlled Host · Mode Engine · Transition Continuity · Capability Framework · Surface Registry unchanged as owners. Single renderer/writer/mount. Capability visual activation remains `0`. Presentation plan is diagnostics-only — does not remount, transfer ownership, or activate chrome.

## 9. Performance Summary

Resolver is O(n log n) over sealed n=12 surfaces. No listeners, polling, timers, observers, or layout reads in the resolver module. Diagnostics are attribute writes only.

## 10. Rollback Plan

Revert feature branch / do not merge. Production remains `7fd6e4b7…`. No DB migration. Independent of later 1B.5.x phases — disable plan diagnostics / remove resolver consumers.

## 11. Final Verdict

```
WX_PHASE_1B5_2_PASS
READY_FOR_FORMAL_REVIEW
```

## Stop gate

**STOP.** Do not author 1B.5.3. Do not merge, deploy, or Production-freeze.
