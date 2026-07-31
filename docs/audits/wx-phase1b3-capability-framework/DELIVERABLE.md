# WX Phase 1B.3 — Capability Activation Framework

**Status:** `READY_FOR_FORMAL_REVIEW`
**Implementation commit (Commit A):** `b0b3d78302695533767f948ba3167a4134d6f062`  
**Browser proof:** `WX_PHASE_1B3_BROWSER_PASS`  
**Branch:** `wx/phase-1b3-capability-framework`  
**Base / production freeze (1B.2):** `a17cbbf6ff58d3010d3911a5917c7706c0bc6524` (`origin/main`)  
**Rollback target:** `a17cbbf6ff58d3010d3911a5917c7706c0bc6524`

**Not authorized:** merge · deploy · production freeze · WX Phase 1B.4

---

## 1. Executive Summary

WX Phase 1B.3 establishes a single pure Capability Activation Framework that resolves each Workspace capability to `available` | `unavailable` | `reserved` from Workspace Mode (+ posture / AvailableSpace-derived Mode plan). Capabilities do not activate visually. GeoFeed ownership and Controlled Host are untouched.

| Area | Outcome |
| --- | --- |
| Canonical resolver | `resolveWorkspaceCapabilities` (+ Mode-plan / AvailableSpace adapters) |
| Contract | `wx-capability-activation-v1` · phase `1b.3` |
| Capability IDs | 13 (8 activatable categories + 5 reserved) |
| Visual activation | Forbidden (`visualActivationAuthorized: false`) |
| Diagnostics | `data-wx-cap-*` on feed workspace shell only |
| Browser | 4/4 fixtures · mount IDs stable · `WX_PHASE_1B3_BROWSER_PASS` |
| Ownership / presentation | Unchanged |

---

## 2. Capability Framework Architecture

```
AvailableSpace (usable W×H)
        │
        ▼
 resolveWorkspaceMode  (1B.1 — frozen)
        │
        ▼
 WorkspaceModePlan (mode · posture · landscapeCarveOut · …)
        │
        ▼
 resolveWorkspaceCapabilitiesFromModePlan  (1B.3 — NEW)
        │
        ▼
 WorkspaceCapabilityPlan
   capabilities[id] ∈ { available, unavailable, reserved }
        │
        ▼
 Diagnostics only (data-wx-cap-*)  — MUST NOT drive CSS / keys / layout
```

**Authority rules**

1. Capabilities MUST NEVER self-activate.  
2. Capabilities MUST NEVER inspect viewport, device, orientation, or user agent.  
3. Capabilities receive activation state exclusively from this framework.  
4. Presentation / rails / memory / professional UI remain out of scope for 1B.3.

---

## 3. Capability Resolution Contract

| Field | Value |
| --- | --- |
| Module | `lib/adaptive-workspace-react/resolve-workspace-capabilities.ts` |
| Contract ID | `wx-capability-activation-v1` |
| Phase | `1b.3` |
| Primary API | `resolveWorkspaceCapabilities(input) → WorkspaceCapabilityPlan` |
| Preferred wiring | `resolveWorkspaceCapabilitiesFromModePlan(modePlan)` |
| AvailableSpace path | `resolveWorkspaceCapabilitiesFromAvailableSpace({ usableWidthPx, usableHeightPx })` |
| Helpers | `getWorkspaceCapabilityState` · `isWorkspaceCapabilityAvailable` |
| Sealed flags | `neverSelfActivate` · `neverInspectViewport` · `neverInspectDevice` · `diagnosticsOnly` · `visualActivationAuthorized: false` |
| Fail-closed | Unknown Mode → `browse` availability · non-finite sizes → `0` |

Exports are public via `lib/adaptive-workspace-react/index.ts`.

---

## 4. Capability Categories

| ID | Class in 1B.3 |
| --- | --- |
| `navigation` | Core / activatable |
| `discovery` | Core / activatable |
| `search` | Core / activatable (reachable counts as available authority) |
| `filters` | Progressive / activatable |
| `panels` | Progressive / Mode-gated |
| `workspace-density` | Progressive / activatable |
| `inspector` | Progressive / Mode-gated |
| `selection` | Progressive / Mode-gated |
| `workspace-memory` | **RESERVED** |
| `contextual-assistance` | **RESERVED** |
| `professional-workspace` | **RESERVED** (capability id — not Professional Mode UI) |
| `ai-collaboration` | **RESERVED** |
| `extensions` | **RESERVED** |

Reserved IDs resolve to `reserved` in every Mode and MUST NOT activate.

---

## 5. Activation Matrix

Mapping WMS v1.1 Y/R/P/—/RES → framework states (`available` / `unavailable` / `reserved`). Reachable/progressive authority is still `available` to the framework; visual surfacing is forbidden in 1B.3.

| Capability | Browse | Compact (carve) | Compact (no carve) | Hybrid | Full | Professional |
| --- | --- | --- | --- | --- | --- | --- |
| navigation | A | A | A | A | A | A |
| discovery | A | A | A | A | A | A |
| search | A | A | A | A | A | A |
| filters | A | A | A | A | A | A |
| panels | U | A | U | A | A | A |
| workspace-density | A | A | A | A | A | A |
| inspector | U | U | U | A | A | A |
| selection | U | A | A | A | A | A |
| workspace-memory | R | R | R | R | R | R |
| contextual-assistance | R | R | R | R | R | R |
| professional-workspace | R | R | R | R | R | R |
| ai-collaboration | R | R | R | R | R | R |
| extensions | R | R | R | R | R | R |

A = available · U = unavailable · R = reserved

---

## 6. Files Changed

| File | Role |
| --- | --- |
| `lib/adaptive-workspace-react/resolve-workspace-capabilities.ts` | Pure capability resolver + contract |
| `lib/adaptive-workspace-react/index.ts` | Public exports |
| `lib/adaptive-workspace-react/tests/fixtures/capability-activation-vectors.ts` | Independent fixtures |
| `lib/adaptive-workspace-react/tests/run-capability-framework-tests.ts` | Contract tests |
| `lib/adaptive-workspace-react/tests/run-transition-continuity-tests.ts` | Phase marker advance `1b.2` → `1b.3` |
| `components/adaptive-workspace/FeedWorkspaceVisibleLayout.tsx` | Diagnostics-only `data-wx-cap-*` + phase `1b.3` |
| `scripts/probe-wx-phase1b3-capability-framework.mjs` | Browser diagnostics probe |
| `package.json` | `test:workspace-capability-framework` + react suite wire-in |
| `docs/audits/wx-phase1b3-capability-framework/*` | Evidence pack |

**Not modified:** GeoFeed · Controlled Host · navigation · landscape menu · rails UI · CSS capability consumers · request identity.

---

## 7. AWA Compliance Matrix

| AWA requirement | 1B.3 evidence |
| --- | --- |
| Single feed owner (GeoFeed) | Unchanged · stable primary slot · mount IDs stable in browser proof |
| Controlled Host unchanged | No Host files touched |
| Stable mount / no remount on Mode | Continuity attrs retained · probe mountBaseline stable |
| AvailableSpace as input authority | Capabilities consume Mode plan derived from AvailableSpace |
| No second feed / ownership fork | No feed ownership changes |

---

## 8. WDL Compliance Matrix

| WDL requirement | 1B.3 evidence |
| --- | --- |
| No presentation redesign | Layout CSS/grid unchanged; diagnostics attrs only |
| Continuous Workspace chrome | Orientation host + rails permanence retained |
| No hollow capability chrome | No capability UI shipped |
| Brand / orientation intact | Orientation strip untouched |

---

## 9. WMS Compliance Matrix

| WMS requirement | 1B.3 evidence |
| --- | --- |
| Mode from AvailableSpace (v1.0) | Still `resolveWorkspaceMode` only |
| Posture orthogonal | Recorded on capability plan; does not invent Mode |
| Compact carve-out gates panels | `landscapeCarveOut` → panels available/unavailable |
| Deterministic Mode→capability | Pure resolver · fixture matrix |

---

## 10. Capability Model Compliance Matrix (WMS v1.1)

| Model rule | 1B.3 evidence |
| --- | --- |
| Mode = capability tier | Activation matrix keyed by Mode |
| No UA / device activation | Forbidden patterns + pure API |
| Progressive unlock | Panels / inspector / selection Mode-gated |
| Reserved future regions | 5 IDs always `reserved` |
| Feed remains CORE | Not a capability toggle; GeoFeed ownership sealed |
| Framework only (no feature UI) | `visualActivationAuthorized: false` |

---

## 11. WQS Compliance Matrix

| WQS theme | 1B.3 evidence |
| --- | --- |
| Determinism | Pure functions · repeatability tests |
| Continuity | Mount IDs stable across Mode fixtures |
| Honesty | Diagnostics expose Mode + capability states; no fake activation |
| Fail-closed | Invalid Mode → browse minimum |
| Testability | Dedicated fixtures + probe oracle independence |

---

## 12. Contract Tests

```bash
npm run test:workspace-capability-framework
```

| Metric | Value |
| --- | --- |
| Layer | contract (not browser mount claim) |
| Groups | 8 |
| Vectors | 6 |
| Assertions | 8 |
| Capability IDs | 13 |
| Reserved IDs | 5 |
| Coverage | every Mode · carve/no-carve · reserved · AvailableSpace path · invalid input · immutability · source side-effect bans · layout diagnostics-only |

Also included in `npm run test:adaptive-workspace-react`. Continuity + Mode engine suites pass with phase marker `1b.3`.

---

## 13. Browser Proof

| Field | Value |
| --- | --- |
| Probe | `scripts/probe-wx-phase1b3-capability-framework.mjs` |
| Artifact | `docs/audits/wx-phase1b3-capability-framework/browser-proof.json` |
| Verdict | `WX_PHASE_1B3_BROWSER_PASS` |
| Fixtures | 4/4 (browse · hybrid · full · professional) |
| Mount baseline | `wx-shell-mount:1` / `wx-primary-mount:1` stable across all steps |
| Visual activation | `data-wx-cap-visual-activation=0` |
| Single page load | Viewport changes only · no reload |
| Claims | diagnostics only — **no** presentation redesign · **no** ownership change |

---

## 14. Responsive Validation

| Viewport | Observed Mode | Capability diagnostics |
| --- | --- | --- |
| 390×844 | browse | panels/inspector/selection unavailable; reserved×5 |
| 820×1180 | hybrid-workspace | panels/inspector/selection available; reserved×5 |
| 1280×800 | full-workspace | full activatable set; reserved×5 |
| 1920×1080 | professional-workspace | full activatable set; reserved×5 |

No responsive redesign. Existing layout bands / Mode engine unchanged.

---

## 15. Regression Report

| Check | Result |
| --- | --- |
| `test:workspace-mode-engine` | PASS |
| `test:workspace-transition-continuity` | PASS (phase marker updated) |
| `test:workspace-capability-framework` | PASS |
| `test:adaptive-workspace-react` | PASS |
| `npm run build` | PASS (local proof build) |
| GeoFeed remount | None observed (mount IDs stable) |
| Host / navigation / menu | Untouched |
| Capability CSS consumers | None introduced |

---

## 16. Performance Assessment

| Signal | Assessment |
| --- | --- |
| Resolver cost | Pure sync map — negligible vs Mode engine |
| Render impact | Extra diagnostic attributes only; no new components / panels |
| Network / request identity | Unchanged |
| Remount / observer recreate | Forbidden and not observed |

No performance regression claimed beyond diagnostics attribute surface.

---

## 17. Production Readiness Verdict

| Gate | Status |
| --- | --- |
| Canonical capability resolver | **PASS** |
| Single activation authority | **PASS** |
| No visual capability activation | **PASS** |
| No ownership changes | **PASS** |
| No runtime regression (local proof) | **PASS** |
| No presentation redesign | **PASS** |
| GeoFeed remains owner | **PASS** |
| Controlled Host unchanged | **PASS** |
| Formal Architecture Review | **PENDING** |
| Formal Workspace / Browser / Performance / Regression Review | **PENDING** |
| Promotion Authorization | **NOT GRANTED** |
| Production Browser Proof / Freeze | **NOT PERFORMED** |

**Verdict:** `READY_FOR_FORMAL_REVIEW`  
**Not claimed:** `PRODUCTION_FROZEN` · `PRODUCTION_SUCCESS` · `READY_FOR_WX_PHASE_1B4`

---

## STOP GATE

**STOP.** Do not begin WX Phase 1B.4.

Wait for:

1. Architecture Review  
2. Workspace Review  
3. Browser Proof (formal)  
4. Performance Review  
5. Regression Review  
6. Promotion Authorization  
7. Production Browser Proof  
8. Production Freeze  

Only after formal Production Freeze may WX Phase 1B.4 be authored.
