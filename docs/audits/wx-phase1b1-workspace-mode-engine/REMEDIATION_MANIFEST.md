# WX Phase 1B.1 — Remediation Manifest

**Status:** `READY_FOR_FORMAL_RE_REVIEW`  
**Artifact role:** Evidence binding for remediation (Commit B).  
**Implementation commit (Commit A):** `8cbce38193e4ecb9e7aa34f5db4081f3db0e0fb7`  
**This evidence commit does not claim to be the implementation commit.**

---

## Original review findings addressed

| Finding | Resolution |
| --- | --- |
| Insufficient boundary tests | Independent fixtures with below/at/above for 720, 1024, 1440, 640, 480 |
| Probe mirrored resolver | Replaced with static viewport expectation matrix |
| Proof not commit-bound | All artifacts bind to Commit A hash `8cbce381…` |
| Missing rollback target | Explicit `4dd1d3ee…` + procedure |

---

## Commit chain

| Commit | Hash | Role |
| --- | --- | --- |
| Production base | `4dd1d3ee52ae56782043c049e0d97e4cea05866e` | Rollback target |
| Original 1B.1 engine | `ae47cd332949db6c94d7c4cfac08a6865bfa492a` | Mode Engine + diagnostics |
| Commit A remediation | `8cbce38193e4ecb9e7aa34f5db4081f3db0e0fb7` | Tests + probe only |
| Commit B (this pack) | *(filled after evidence commit)* | Evidence only |

---

## Validation against Commit A

| Check | Result |
| --- | --- |
| Isolated worktree | `/Users/sergioarrias/homecheff-wx-1b1-remediation-a` @ `8cbce381` |
| Clean at checkout | Yes |
| `npm run test:workspace-mode-engine` | Pass · 7 groups · 27 vectors · 219 assertions |
| Browser proof | `WX_PHASE_1B1_PASS` · 12/12 · oracle `static-viewport-fixture-matrix` |
| Proof timestamp | `2026-07-31T13:43:02.337Z` |
| Merge / deploy / 1B.2 | None |

---

## Rollback (do not execute)

Target: `4dd1d3ee52ae56782043c049e0d97e4cea05866e`  
Exclude/revert: `ae47cd33`, `8cbce381`, and evidence Commit B.  
No DB/data migrations; no ownership transfer; restores pre-1B.1 baseline.  
Prohibit Phase 1B.2 during rollback.

---

## Declarations

- No production behaviour change in Commit A (tests/probe only).
- No unauthorized files in Commit A or Commit B.
- Dual band-table separation retained (accepted warning).
- Architecture specs not modified.
