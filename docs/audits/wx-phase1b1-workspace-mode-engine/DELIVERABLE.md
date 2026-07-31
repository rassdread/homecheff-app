# WX Phase 1B.1 — Workspace Mode Engine

**Status:** `READY_FOR_FORMAL_RE_REVIEW`  
**Implementation commit (Commit A):** `8cbce38193e4ecb9e7aa34f5db4081f3db0e0fb7`  
**Evidence wrapper:** this document / freeze-pack / browser-proof (Commit B — not the implementation commit)  
**Production rollback target:** `4dd1d3ee52ae56782043c049e0d97e4cea05866e`  
**Branch:** `wx/phase-1b1-workspace-mode-engine`  
**Remote implementation hash:** `8cbce38193e4ecb9e7aa34f5db4081f3db0e0fb7`

**Not claimed:** `PRODUCTION_FROZEN` · `PRODUCTION_SUCCESS` · `READY_FOR_WX_PHASE_1B2`

---

## 1. Executive Summary

WX Phase 1B.1 establishes a pure Workspace Mode Engine and diagnostics. Formal review required remediation of boundary tests, probe oracle independence, and evidence binding. Remediation Commit A closes those blockers without changing production Mode behaviour.

| Area | Outcome |
| --- | --- |
| Mode Engine | Unchanged pure `resolveWorkspaceMode` |
| Tests | 27 independent vectors · 219 assertions · below/at/above all thresholds |
| Probe | Static viewport fixture matrix (no mirrored resolver) |
| Browser proof | 12/12 `WX_PHASE_1B1_PASS` against exact Commit A |
| Ownership / presentation | Unchanged |

---

## 2. Workspace Mode Engine Overview

| Property | Implementation |
| --- | --- |
| Module | `lib/adaptive-workspace-react/resolve-workspace-mode.ts` |
| API | `resolveWorkspaceMode(input) → WorkspaceModePlan` |
| Layout owner | Still `resolveFeedWorkspaceVisibleLayout` |
| Mode owner | `resolveWorkspaceMode` only |
| Diagnostics | `data-wx-mode` / `data-wx-posture` / token / carve / demote / `data-wx-phase=1b.1` |

**Accepted bounded warning:** `FEED_WORKSPACE_LAYOUT_BANDS` and `WORKSPACE_MODE_BANDS` remain separate tables (layout/rails vs semantic Mode). Not consolidated in this phase.

---

## 3. Remediation Evidence (Commit A → Commit B)

| Field | Value |
| --- | --- |
| Implementation commit | `8cbce38193e4ecb9e7aa34f5db4081f3db0e0fb7` |
| Implementation parent | `ae47cd332949db6c94d7c4cfac08a6865bfa492a` |
| Production base / rollback | `4dd1d3ee52ae56782043c049e0d97e4cea05866e` |
| Test command | `npm run test:workspace-mode-engine` |
| Check groups | 7 |
| Vectors | 27 |
| Assertions | 219 |
| Thresholds | 720 · 1024 · 1440 · 640 · 480 (below/at/above) |
| Browser | Independent worktree `/Users/sergioarrias/homecheff-wx-1b1-remediation-a` · clean at checkout · port 3085 |
| Browser verdict | `WX_PHASE_1B1_PASS` · oracle `static-viewport-fixture-matrix` |
| Proof timestamp | see `browser-proof.json` |
| Merge | **not performed** |
| Production deploy | **not performed** |
| Phase 1B.2 | **not performed** |

---

## 4. Rollback Plan (do not execute)

| Item | Detail |
| --- | --- |
| Exact rollback target | `4dd1d3ee52ae56782043c049e0d97e4cea05866e` |
| Commits to exclude/revert | `ae47cd33` (engine) · `8cbce381` (test/probe remediation) · subsequent evidence Commit B |
| Database migration | **None** |
| Data migration | **None** |
| Permanent runtime ownership transfer | **None** |
| Effect | Restores pre-1B.1 production baseline (`data-wx-phase=1a.1`, no Mode Engine diagnostics) |
| Verification after rollback | Homepage loads · feed mounts once · no `data-wx-mode` · no console/hydration errors |
| During rollback | **Do not** begin WX Phase 1B.2 |

---

## 5. Architecture Reference Lineage (read-only)

These were **not** modified by remediation. Formal review noted they were untracked WIP:

| Document | Path | SHA-256 (review/remediation time) | Tracked in Commit A? |
| --- | --- | --- | --- |
| WMS v1.0 | `/Users/sergioarrias/Homecheff-app git/docs/architecture/homecheff-workspace-modes-specification-v1.md` | `4ee0e0bbe9f716054ca7f62ec3c5575725da527797056a817b544ba0c3e06906` | No |
| WMS v1.1 | `…/homecheff-workspace-modes-specification-v1.1.md` | `c5de45efae8afd519e981c688616ad4c25eaf3f3006044f68b8a7771a2adc145` | No |
| WQS v1 | `…/homecheff-workspace-quality-standard-v1.md` | `621d893d6fd6a24934a58e6309b71d4d9dba2a70cb6f4944e063b1ccad9f5880` | No |
| 1B Master Spec | `…/homecheff-wx-phase1b-master-specification.md` | `3e3520d9ff9ddffed4687346e9cd667b5eb7b946b36f1e4bddcc22d41dc64f00` | No |
| WDL v1 | tracked in repo at Commit A | (in tree) | Yes |
| AWA platform contract | tracked in repo at Commit A | (in tree) | Yes |

**Bounded documentation-lineage warning:** WMS/WQS/Master Spec remain untracked local references until a separate architecture commit freezes them.

---

## 6. Files (implementation vs evidence)

### Commit A (implementation remediation — tests/probe only)

| File | Class |
| --- | --- |
| `lib/adaptive-workspace-react/tests/fixtures/workspace-mode-engine-vectors.ts` | AUTHORIZED_TEST_REMEDIATION |
| `lib/adaptive-workspace-react/tests/run-workspace-mode-engine-tests.ts` | AUTHORIZED_TEST_REMEDIATION |
| `scripts/probe-wx-phase1b1-workspace-mode-engine.mjs` | AUTHORIZED_PROBE_REMEDIATION |

### Commit B (evidence only — this pack)

| File | Class |
| --- | --- |
| `docs/audits/wx-phase1b1-workspace-mode-engine/DELIVERABLE.md` | AUTHORIZED_EVIDENCE_REMEDIATION |
| `docs/audits/wx-phase1b1-workspace-mode-engine/browser-proof.json` | AUTHORIZED_EVIDENCE_REMEDIATION |
| `docs/audits/wx-phase1b1-workspace-mode-engine/freeze-pack.json` | AUTHORIZED_EVIDENCE_REMEDIATION |
| `docs/audits/wx-phase1b1-workspace-mode-engine/REMEDIATION_MANIFEST.md` | AUTHORIZED_EVIDENCE_REMEDIATION |

---

## 7. STOP GATE

**STOP.** Do not merge. Do not deploy. Do not begin WX Phase 1B.2. Do not declare production freeze.

Wait for independent formal re-review of Commit A (`8cbce381`) and Commit B (evidence wrapper).
