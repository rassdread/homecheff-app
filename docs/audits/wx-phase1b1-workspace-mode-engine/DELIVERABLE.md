# WX Phase 1B.1 — Workspace Mode Engine

**Status:** COMPLETE — awaiting Architecture / Workspace / Browser / Performance / Regression / Production approval (**STOP GATE**)  
**Verdict:** `WX_PHASE_1B1_PASS`  
**Scope:** Deterministic Workspace Mode + Posture resolution only. No capability activation. No layout/presentation changes. No GeoFeed / Host ownership changes.

---

## 1. Executive Summary

WX Phase 1B.1 introduces a single authoritative **Workspace Mode Engine**: a pure, side-effect-free resolver that maps AvailableSpace (`usableWidthPx` × `usableHeightPx`) to WMS Modes and Posture.

| Area | Outcome |
| --- | --- |
| Mode Engine | `resolveWorkspaceMode` — Browse · Compact · Hybrid · Full · Professional + portrait/landscape |
| Authority | Single resolver; diagnostics on `[data-aw-feed-workspace]` (`data-wx-mode`, `data-wx-posture`, …) |
| Capabilities | **None** activated |
| Presentation | **Unchanged** — Mode does not drive grid/rails/CSS in 1B.1 |
| Ownership | GeoFeed + Controlled Host unchanged |
| Proof | Unit vectors pass · browser matrix 320–2560 + phone landscape → `WX_PHASE_1B1_PASS` |

---

## 2. Workspace Mode Engine Overview

| Property | Implementation |
| --- | --- |
| Module | `lib/adaptive-workspace-react/resolve-workspace-mode.ts` |
| API | `resolveWorkspaceMode(input) → WorkspaceModePlan` |
| Inputs | AvailableSpace dims (+ optional forward-compat interaction/density that **must not** alter Mode in 1B.1) |
| Outputs | `mode`, `posture`, `workingAreaPx`, `heightDemoted`, `landscapeCarveOut`, `profileAffinity`, `stabilityToken` |
| Bands | Aligned with `FEED_WORKSPACE_LAYOUT_BANDS` (720 / 1024 / 1440 / landscape carve-out ≥640) |
| Wiring | `FeedWorkspaceVisibleLayout` calls the engine for diagnostics only; layout still from `resolveFeedWorkspaceVisibleLayout` |

---

## 3. Architecture Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| AD-1 | Pure function, no React, no DOM | Testable · UI-independent · WMS purity |
| AD-2 | Consume AvailableSpace; never modify it | Engine is a reader, not a measurement owner |
| AD-3 | Mode does not drive layout in 1B.1 | Avoids presentation / capability leakage; layout remains existing visible-layout plan |
| AD-4 | Reuse numeric bands from feed visible-layout | Deterministic continuity with frozen 1A.x shell; WMS product language (Mode names) is the public vocabulary |
| AD-5 | Short-height demotes Full/Professional one step | WMS §4.4 honesty without inventing device forks |
| AD-6 | Interaction/density recorded but ignored for Mode | Forward-compatible API without 1B.1 behaviour change |
| AD-7 | Diagnostics via `data-wx-*` only | Browser-provable without CSS or chrome redesign |

---

## 4. Workspace Mode Resolution Strategy

```
width ≥ 1440 → professional-workspace
width ≥ 1024 → full-workspace
width ≥ 720  → hybrid-workspace
else if landscape AND width ≥ 640 → compact-workspace (carve-out)
else → browse

posture = width > height ? landscape : portrait

if height < 480 AND mode ∈ {professional, full}:
  demote one step (Professional→Full, Full→Hybrid)
```

Same floors of AvailableSpace always yield the same Mode + Posture. No UA, OS, device names, randomness, or async switching.

---

## 5. Files Changed

| File | Change |
| --- | --- |
| `lib/adaptive-workspace-react/resolve-workspace-mode.ts` | **New** Mode Engine |
| `lib/adaptive-workspace-react/index.ts` | Re-exports |
| `lib/adaptive-workspace-react/tests/run-workspace-mode-engine-tests.ts` | **New** unit/vector tests |
| `components/adaptive-workspace/FeedWorkspaceVisibleLayout.tsx` | Diagnostics attributes + `data-wx-phase=1b.1` only |
| `package.json` | `test:workspace-mode-engine`; fold into `test:adaptive-workspace-react` |
| `scripts/probe-wx-phase1b1-workspace-mode-engine.mjs` | Browser Mode-resolution proof |
| `docs/audits/wx-phase1b1-workspace-mode-engine/*` | Deliverable + proof |

**Not changed:** GeoFeed, Controlled Host, AvailableSpace algorithms, rails/grid logic, navigation, CSS presentation (no layout CSS edits).

---

## 6. Architecture Compliance Matrix (AWA)

| Principle | 1B.1 status |
| --- | --- |
| AvailableSpace primary | ✅ Mode from usable width/height only |
| Deterministic resolution | ✅ Pure function + stability token |
| No brand/model/UA exceptions | ✅ Source scan + API has no UA fields |
| Single ownership (GeoFeed / Host) | ✅ Untouched |
| Stable mount / no remount on Mode | ✅ Mode is diagnostic; layout plan owner unchanged |
| Progressive disclosure of behaviour | ✅ Mode identity only; capabilities deferred |

---

## 7. WDL Compliance Matrix

| Principle | 1B.1 status |
| --- | --- |
| P10 Responsive modes via WMS | ✅ Mode names replace device vocabulary for identity |
| P11 AvailableSpace | ✅ Consumed; not mutated |
| Presentation continuity (1A.x) | ✅ No chrome/layout redesign |
| Orientation as Workspace chrome | ✅ Unchanged; posture labeled only |

---

## 8. WMS Compliance Matrix

| Requirement | 1B.1 status |
| --- | --- |
| Five Modes | ✅ browse · compact-workspace · hybrid-workspace · full-workspace · professional-workspace |
| Posture orthogonal | ✅ portrait \| landscape |
| AvailableSpace-only entry | ✅ |
| Landscape Compact carve-out story | ✅ width &lt;720 · landscape · ≥640 |
| Mid landscape → Hybrid band | ✅ e.g. 844×390 → hybrid-workspace |
| Short-height honesty | ✅ demote Full/Professional |
| Deterministic same-input → same Mode | ✅ unit + browser |
| Capabilities not Mode Engine work | ✅ none activated |

---

## 9. Capability Model Compliance Matrix

| Capability / surface | 1B.1 |
| --- | --- |
| Assist / dual rails / inspector / selection | ❌ not activated |
| Context Memory / AI / Collaboration / Extensions (RES) | ❌ locked; not touched |
| Progressive unlock framework | ❌ deferred to 1B.3+ |
| Engine may record affinity flags only | ✅ `landscapeCarveOut`, `profileAffinity` diagnostic |

---

## 10. WQS Compliance Matrix

| Gate | Evidence |
| --- | --- |
| Architecture citation | This deliverable + WMS/WDL/AWA matrices |
| AvailableSpace-first | Engine + probe compare measured `clientWidth`/`height` |
| No device forks | Unit source scan |
| Local unit proof | `npm run test:workspace-mode-engine` — pass |
| Browser proof | `browser-proof.json` — `WX_PHASE_1B1_PASS` |
| No ownership regression | Host/GeoFeed files untouched; single workspace root asserted |
| No presentation regression | Layout still from prior resolver; no CSS capability chrome |
| STOP before next phase | **Mandatory** — no 1B.2 until approval |

---

## 11. Browser Proof

| Field | Value |
| --- | --- |
| Script | `scripts/probe-wx-phase1b1-workspace-mode-engine.mjs` |
| Server | `HOMECHEFF_FEED_WORKSPACE_VISIBILITY_MODE=on` · `http://127.0.0.1:3083` |
| Artifact | `docs/audits/wx-phase1b1-workspace-mode-engine/browser-proof.json` |
| Verdict | **`WX_PHASE_1B1_PASS`** |
| Assertions | `data-wx-phase=1b.1` · Mode/Posture match engine · single workspace · no hydration warnings · no console errors |

Observed Modes (**measured AvailableSpace** = workspace `clientWidth`, not marketing viewport):

| Viewport | Measured width ≈ | Mode | Posture |
| --- | --- | --- | --- |
| 320–430 portrait | = viewport | browse | portrait |
| 844×390 landscape | ~826 | hybrid-workspace | landscape |
| 768 / 820 portrait | ~750 / ~802 | hybrid-workspace | portrait |
| 1024 landscape | ~998 (&lt;1024 band) | hybrid-workspace | landscape |
| 1280 | ~1254 | full-workspace | landscape |
| 1440 | ~1414 (&lt;1440 band) | full-workspace | landscape |
| 1920 / 2560 | ~1894 / ~2534 | professional-workspace | landscape |

Shell chrome slightly reduces usable width vs CSS viewport; Mode follows AvailableSpace honesty (WMS), not device viewport labels.

---

## 12. Responsive Validation

Portrait and landscape postures resolve correctly across the required matrix. Validation is **Mode resolution only** — not capability activation, landscape work chrome, or density systems (later phases).

---

## 13. Regression Report

| Guard | Result |
| --- | --- |
| GeoFeed ownership | Unchanged (no feed ownership edits) |
| Controlled Host | Unchanged |
| Single renderer / writer / mount | Single `[data-aw-feed-workspace]`; Mode does not remount primary |
| Layout plan owner | Still `resolveFeedWorkspaceVisibleLayout` |
| Feed reload on Mode | Not introduced (Mode is pure + attribute emit) |
| Hydration / console | Clean on all probe viewports |
| 1A / 1A.1 / 1A.2 presentation | No intentional chrome/CSS presentation edits in 1B.1 |

---

## 14. Performance Impact Assessment

| Factor | Assessment |
| --- | --- |
| Resolver cost | O(1) arithmetic — negligible vs feed/i18n network |
| Extra network | None |
| Extra observers | None (reuses existing measurement) |
| Remount / reload risk | None in this phase |

---

## 15. Production Readiness Verdict

| Criterion | Status |
| --- | --- |
| Single authoritative Mode Engine | ✅ |
| Deterministic resolution | ✅ |
| No capability activation | ✅ |
| No presentation / ownership / feed behaviour change | ✅ |
| Local unit + browser proof | ✅ `WX_PHASE_1B1_PASS` |
| Production deploy | **Not required for freeze of engine identity**; deploy only after formal Production Approval if desired for live diagnostics |

**Phase verdict:** Ready for Architecture Review · Workspace Review · Browser Proof Review · Performance Review · Regression Review · Production Approval.

---

## MANDATORY STOP GATE

**STOP.**

Do **not** begin **WX Phase 1B.2 — Transition Continuity**.

Wait for:

1. Architecture Review  
2. Workspace Review  
3. Browser Proof  
4. Performance Review  
5. Regression Review  
6. Production Approval  

Only after formal approval and freeze may WX Phase 1B.2 be authored.
