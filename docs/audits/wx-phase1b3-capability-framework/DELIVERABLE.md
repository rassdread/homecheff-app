# WX Phase 1B.3 — Capability Activation Framework (Current-Main Reconstruction)

**Status:** `READY_FOR_FORMAL_RE_REVIEW`  
**Remediation verdict target:** `WX_PHASE_1B3_CURRENT_MAIN_RECONSTRUCTION_COMPLETE`  
**Branch:** `wx/phase-1b3-capability-framework-current-main`  
**Proof binding (Commit B):** `8b2c36a187c65091b988ba5e3fbfea95b8467b13`  
**Implementation (Commit A):** `a1a56a1ccf4f60c16b5b7b2e51edddc3c9a51dbe`  
**Base / origin/main:** `86d0b08d434626d45b7ed1b27cd2d4a2ebaa8c35`  
**Production runtime baseline / rollback:** `3ddaf59cfd1e95f2276a165cd81807f3de289849`  

**Not authorized:** merge · deploy · production freeze · WX Phase 1B.4 · landscape menu removal

---

## 1. Executive Summary

WX Phase 1B.3 was reconstructed on exact current `origin/main` after formal review `WX_PHASE_1B3_CHANGES_REQUIRED`. The old feature branch predates the Production-frozen 1B.2.1 mobile-landscape scroll fix; this remediation does not rebase that branch.

The reconstructed tree contains:

- complete 1B.2 + 1B.2.1 Production lineage (height-chain / multiCol `h-full overflow-hidden`);
- canonical pure Capability Activation Framework (`wx-capability-activation-v1`);
- diagnostics-only `data-wx-cap-*` + `data-wx-phase=1b.3`;
- Compact Workspace browser proof (measured AvailableSpace);
- landscape scroll regression proof via sealed 1B.2.1 harness on the same tree;
- no visual capability activation.

---

## 2. Original Lineage Blocker

| Item | Value |
| --- | --- |
| Old branch | `wx/phase-1b3-capability-framework` |
| Old impl | `b0b3d78302695533767f948ba3167a4134d6f062` |
| Old evidence tip | `28a4ff4b4ff6c8c5febde36b21e79c1ae3d19670` |
| Old base | `a17cbbf6…` (pre-1B.2.1) |
| Blocker | 1B.2.1 (`3ddaf59c`) not an ancestor; throwaway merge conflicts in `FeedWorkspaceVisibleLayout.tsx` + `package.json` |
| Old branch status | **untouched** (no force-push / no in-place rebase) |

---

## 3. Current origin/main and Production Baseline

| Ref | Full hash |
| --- | --- |
| `origin/main` (reconstruction base) | `86d0b08d434626d45b7ed1b27cd2d4a2ebaa8c35` |
| Production runtime (1B.2.1 merge) | `3ddaf59cfd1e95f2276a165cd81807f3de289849` |
| Rollback for reconstructed 1B.3 | `3ddaf59cfd1e95f2276a165cd81807f3de289849` (not `a17cbbf6`) |

---

## 4. Reconstruction Branch

`wx/phase-1b3-capability-framework-current-main` created from exact `origin/main` in isolated worktree `/Users/sergioarrias/homecheff-wx-1b3-recon`.

---

## 5. File-by-File Reconstruction Audit

See `reconstruction-manifest.json` for the authoritative table. Summary:

| Path | Class |
| --- | --- |
| `resolve-workspace-capabilities.ts` | `AUTHORIZED_CAPABILITY_RESOLVER` / `AUTHORIZED_CAPABILITY_TYPES` |
| `index.ts` (exports) | `AUTHORIZED_CAPABILITY_TYPES` |
| `FeedWorkspaceVisibleLayout.tsx` (surgical) | `AUTHORIZED_CAPABILITY_DIAGNOSTICS` |
| capability fixtures + tests | `AUTHORIZED_CAPABILITY_TEST` |
| continuity phase assert | `AUTHORIZED_CAPABILITY_TEST` |
| `package.json` scripts | `AUTHORIZED_CAPABILITY_TEST` |
| `probe-wx-phase1b3-capability-framework.mjs` | `AUTHORIZED_CAPABILITY_PROBE` |
| this evidence pack | `AUTHORIZED_REMEDIATION_EVIDENCE` |
| Unauthorized files | **none** |

`FeedWorkspaceVisibleLayout.tsx` was **not** restored from the old branch. Diagnostics were integrated into the current-main file that retains 1B.2.1 multiCol hosts (`min-w-0 min-h-0 h-full overflow-hidden`).

---

## 6. Incident-Fix Preservation

Verified present after reconstruction:

- multi-column bounded height + `h-full` / `min-h-0` propagation on Region/Slot/Panel;
- multiCol slot hosts `h-full overflow-hidden`;
- feed remains phone-landscape scroll owner (`overflow-y-auto`);
- sealed 1B.2.1 harness: `WX_PHASE_1B2_1_MOBILE_LANDSCAPE_SCROLL_FIX_PASS` on this tree.

---

## 7. Capability Contract Review

| Field | Value |
| --- | --- |
| Contract | `wx-capability-activation-v1` |
| Phase | `1b.3` |
| Resolver | pure · deterministic · sync · side-effect free · React-independent |
| States | `available` \| `unavailable` \| `reserved` |
| Visual activation | `visualActivationAuthorized: false` |
| Fail-closed | unknown Mode → browse; non-finite sizes → `0`; unknown capability ID → unavailable |

---

## 8. Capability Inventory and Matrix

13 capability IDs covered by independent fixtures (7 Mode×posture vectors including Compact carve / no-carve and Hybrid landscape). Progressive unlock verified for `panels` / `selection` / `inspector`.

---

## 9. Reserved Capability Verification

All five reserved IDs remain `reserved` for every Mode/posture:

`workspace-memory`, `contextual-assistance`, `professional-workspace`, `ai-collaboration`, `extensions`.

---

## 10. Diagnostic Safety

- `data-wx-cap-*` + `data-wx-cap-visual-activation="0"` on feed workspace shell only.
- No CSS consumers of `data-wx-cap-*` (browser visible DOM delta = 0).
- Repo consumer search: no unexpected behavioural JS consumers.
- Not used as React keys / request triggers / observers.

---

## 11. Contract Test Results

`npm run test:workspace-capability-framework` → **12 groups / 7 vectors / 12 assertions PASS**

Also PASS:

- `test:workspace-transition-continuity`
- `test:workspace-mode-engine`
- `test:mobile-landscape-scroll`
- `test:adaptive-workspace-react` (includes capability suite)
- `test:adaptive-workspace` (34 assertions)
- `npm run lint`
- `npm run smoke-check` (with local `.env.local`)
- `npm run build` (production) with feed workspace flags

Standalone `tsc --noEmit` against a linked `node_modules` reported missing `@types/*` resolution noise; Next production build completed successfully and is the authoritative compile gate used here.

---

## 12. Browser Mode Matrix

`browser-proof.json` verdict: **`WX_PHASE_1B3_BROWSER_PASS`**

| Mode | Proven |
| --- | --- |
| Browse | yes |
| Compact Workspace | yes (measured AvailableSpace) |
| Hybrid Workspace | yes |
| Full Workspace | yes |
| Professional Workspace | yes |

Mode fixtures: **8/8** pass. Mount IDs stable across Mode matrix session. Console/hydration errors: **0**.

---

## 13. Compact Workspace Proof

Observed Compact via measured AvailableSpace (examples):

| Viewport | Measured | Mode |
| --- | --- | --- |
| 680×360 | 662×360 | `compact-workspace` |
| 700×360 | 682×360 | `compact-workspace` |
| 710×360 | 692×360 | `compact-workspace` |

---

## 14. Mobile Landscape Scroll Regression Proof

Inline required viewport matrix: **10/10** (diagnostics + height chain + phase 1b.3).

Sealed harness on same tree: **`WX_PHASE_1B2_1_MOBILE_LANDSCAPE_SCROLL_FIX_PASS`**

Harness touch-drag true for phone landscape multiCol (844/932/740/812). Programmatic `scrollTop` alone was **not** accepted as proof.

Evidence: `browser-proof.json` + `landscape-1b21-harness/browser-proof.json`.

---

## 15. Mount and Ownership Proof

- Mode-matrix session: stable shell/primary mount IDs; `data-wx-continuity-remount=0`.
- GeoFeed ownership / Controlled Host: unchanged (diagnostics-only; no ownership APIs touched).
- Visible capability DOM delta: **0**.

---

## 16. Performance Assessment

Capability resolution is a pure synchronous map over 13 IDs; diagnostics are attribute writes only. Negligible runtime cost relative to layout/Mode work. No additional network requests observed from capability diagnostics.

---

## 17. Architecture Document Lineage

Recorded in `reconstruction-manifest.json` (content hashes). WMS v1 / v1.1, WQS, and 1B Master Spec remain **untracked architecture WIP** on the primary workspace disk. This remediation **did not copy or modify** them. Matrix semantics match the reviewed 1B.3 implementation; reproducibility is sufficient via fixtures + resolver + hashes.

---

## 18. Rollback Plan

| Field | Value |
| --- | --- |
| Rollback target | `3ddaf59cfd1e95f2276a165cd81807f3de289849` |
| Method | revert/remove 1B.3 commits on this branch (or do not merge) |
| Preserves | 1B.2.1 landscape scroll fix |
| Migrations | none |
| Executed | **no** |

---

## 19–21. Commits

| Commit | Hash | Parent | Contents |
| --- | --- | --- | --- |
| A | `a1a56a1ccf4f60c16b5b7b2e51edddc3c9a51dbe` | `86d0b08d…` | resolver + exports + current-main diagnostics |
| B | `8b2c36a187c65091b988ba5e3fbfea95b8467b13` | A | fixtures, tests, probe, scripts |
| C | `c0123772f81e2e14db71f61c87a917a6413ab775` | B | evidence only; binds to B |

Remote hashes filled after push.

---

## 22. Remaining Warnings

- Architecture WIP docs (WMS/WQS/1B Master) remain untracked outside this branch — not a publication task.
- Standalone `tsc --noEmit` via linked `node_modules` is noisy; rely on Next production build.
- Formal re-review still required before any merge/deploy/freeze.

---

## 23. Final Remediation Verdict

`WX_PHASE_1B3_CURRENT_MAIN_RECONSTRUCTION_COMPLETE`

`READY_FOR_WX_PHASE_1B3_FORMAL_RE_REVIEW`

**STOP.** Do not merge · do not deploy · do not Production-freeze · do not begin 1B.4.
