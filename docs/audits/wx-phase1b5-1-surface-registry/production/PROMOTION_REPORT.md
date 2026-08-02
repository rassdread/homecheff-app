# WX Phase 1B.5.1 — Promotion Report

**Final verdict:** `WX_PHASE_1B5_1_PRODUCTION_SUCCESS`  
**Status:** `PRODUCTION_FROZEN`

---

## 1. Executive Summary

WX Phase 1B.5.1 (Surface Presentation Registry) was promoted from reviewed tip `3c780d8a…` into current `origin/main` as merge `f988f8ff…`, deployed to official Production project `homecheff-app` as `dpl_FDTJ9VryzCYpfsiTQBnHwEP3w2YF`, and live-proven on `https://homecheff.eu` / `.nl`.

Pure immutable registry only: 12 surfaces, 4 reserved, contract `wx-surface-presentation-registry-v1` @ `1.0.0`. Diagnostics only. No resolver, no capability activation, no presentation/navigation/ownership change.

**Lineage correction vs promotion brief:** at Gate 1, `origin/main` and live Production were already `34fb1f80…` (1B.4 freeze docs tip), not `0b84f593…`. Merge target used was current `origin/main` (`34fb1f80…`). Immediate rollback = merge parent `34fb1f80…`. Ancestral 1B.4 behavioural merge `0b84f593…` remains on history.

---

## 2. Merge Report

| Field | Value |
| --- | --- |
| Method | `git merge --no-ff` (ort) |
| Merge hash | `f988f8ffea5751cf6ee2638f3654b4339fc22e63` |
| Parents | `34fb1f80041e6de26e1753e5ad7f85f6d73f9366` · `3c780d8af7abe5451e4cfec3b74a8315ccb86b16` |
| Conflicts | none (`CLEANLY_MERGEABLE`) |
| Force-push | no |
| Feature branch | retained (`wx/phase-1b5-1-surface-registry`) |
| `origin/main` at merge push | `f988f8ffea5751cf6ee2638f3654b4339fc22e63` |

Chain A→B→tip intact: `33812ebc` → `0fc12b4c` → `3c780d8a`.

`GATE_MERGE_PASS`

---

## 3. Production Deployment

| Field | Value |
| --- | --- |
| Project | `homecheff-app` (`prj_V0aZoSgSjd8dJKM0YtWkAKI88NLV`) |
| Deployment ID | `dpl_FDTJ9VryzCYpfsiTQBnHwEP3w2YF` |
| URL | `https://homecheff-kfzut9u4a-sergio-s-projects-f7b64ee1.vercel.app` |
| Target | production · READY |
| Aliases | `homecheff.eu` · `homecheff.nl` · www |
| Created | 2026-08-02 ~02:04 CEST |

`GATE_PRODUCTION_DEPLOYMENT_PASS`

---

## 4. Runtime Hash

| Field | Value |
| --- | --- |
| Expected merge | `f988f8ffea5751cf6ee2638f3654b4339fc22e63` |
| Vercel `gitCommitSha` | `f988f8ffea5751cf6ee2638f3654b4339fc22e63` |
| Live alias dpl | `dpl_FDTJ9VryzCYpfsiTQBnHwEP3w2YF` (eu/nl/www) |
| Immediate rollback | `34fb1f80041e6de26e1753e5ad7f85f6d73f9366` |

`GATE_RUNTIME_HASH_PASS`

---

## 5. Registry Verification

| Check | Result |
| --- | --- |
| Contract ID | `wx-surface-presentation-registry-v1` |
| Version | `1.0.0` |
| Surface count | 12 |
| Reserved | 4 (`reserved-memory`, `reserved-ai`, `reserved-collaboration`, `reserved-extensions`) |
| IDs (stable order) | `stage,orientation,command,assist-primary,assist-secondary,tool,disclosure,utility,reserved-memory,reserved-ai,reserved-collaboration,reserved-extensions` |
| Resolver | absent |
| Capability visual activation | `0` |
| Pre-merge contract suites | surface-registry 12/12 · mode-engine · transition · mobile-landscape · capability · landscape-posture · nav-preservation — all PASS |
| Production build (pre-merge) | PASS |

`GATE_REGISTRY_PASS`

---

## 6. Browser Proof

Base: `https://homecheff.eu`

| Probe | Verdict | Score |
| --- | --- | --- |
| Surface registry matrix | `WX_PHASE_1B5_1_BROWSER_PROOF_PASS` | 9/9 |

Viewports: 320×568, 390×844, 740×360, 844×390, 1024×768, 1280×800, 1440×900, 1920×1080, 2560×1440.

Confirmed: registry/version/reserved/ids identical across all; remount `0`; no new surface panels; no overflow-x; no page errors.

Artifact: `browser-proof.json`

---

## 7. Ownership Verification

| Guard | Result |
| --- | --- |
| GeoFeed sole runtime/data owner | Unchanged |
| Controlled Host | Unchanged |
| Single workspace mount | 1 |
| Single primary mount | 1 |
| Continuity remount | `0` |
| Capability visual activation | `0` |
| Console / page errors | none (filtered noise) |
| Presentation resolver | not present |
| Navigation / presentation behaviour | no activation change |

Artifact: `ownership-live.json`

`GATE_OWNERSHIP_PASS`

---

## 8. Performance Summary

Diagnostics-only attribute exposure on existing Workspace shell. No resolver, no capacity gating, no additional layout measurement, no feed ownership change, no remount observed (`data-wx-continuity-remount=0`). First Load JS shared remained ~638 kB class in deploy build.

---

## 9. Rollback Verification

| Item | Value |
| --- | --- |
| Immediate rollback commit | `34fb1f80041e6de26e1753e5ad7f85f6d73f9366` |
| Method | redeploy prior Production SHA / revert merge |
| DB migration | none |
| Clear path | yes |

`GATE_ROLLBACK_CLEAR`

---

## 10. Freeze Summary

Artifacts bound to merge `f988f8ff…`:

- `PRODUCTION_FREEZE.md`
- `PROMOTION_REPORT.md`
- `production-freeze-pack.json`
- `browser-proof.json`
- `ownership-live.json`

`GATE_FREEZE_PASS`

---

## 11. Remaining Warnings

| Warning | Status |
| --- | --- |
| Hard-coded navigation lists duplicated (desktop / bottom / hamburger) | ACCEPTED_BOUNDED_WARNING (from 1B.4) |
| Dual posture diagnostic sources (Mode Engine vs ChromeProvider VV) | REQUIRES_FUTURE_TRACKING (from 1B.4) |
| Promotion brief listed `origin/main`/`Production` as `0b84f593…` while live was `34fb1f80…` | CORRECTED_AT_GATE_1 — merge used actual tip |

---

## 12. Final Verdict

`WX_PHASE_1B5_1_PRODUCTION_SUCCESS`

**STOP.** Do not begin WX Phase 1B.5.2 until explicit approval after this Production freeze.
