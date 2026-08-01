# WX Phase 1B.4 — Promotion Report

**Final verdict:** `WX_PHASE_1B4_PRODUCTION_SUCCESS`  
**Status:** `PRODUCTION_FROZEN`

---

## 1. Executive Summary

WX Phase 1B.4 (Landscape Work Posture + navigation remediation) was promoted from reviewed tip `170c21dc…` into `origin/main` as merge `0b84f593…`, deployed to official Production project `homecheff-app` as `dpl_E5ZY7VK6ewGYB9HtViqgAFq9RbGY`, and live-proven on `https://homecheff.eu` / `.nl`.

Create and `/mijn-hcp` are reachable in below-lg landscape; collapsed bottom nav is hidden + aria-hidden + inert; MATERIAL workspace reclaim and mobile landscape touch scrolling are preserved; capability visual activation remains `0`.

---

## 2. Merge Report

| Field | Value |
| --- | --- |
| Method | `git merge --no-ff` (ort) |
| Merge hash | `0b84f593b3dda5cbe2e54adf30f809a5bab076cc` |
| Parents | `be6de2e01ab326b1b6306720e82aea8b4d3fdc2f` · `170c21dcce652d0fb4776e5db96ad41c73b79966` |
| Conflicts | none |
| Force-push | no |
| Feature branch | retained (`wx/phase-1b4-landscape-work-posture`) |
| `origin/main` | `0b84f593b3dda5cbe2e54adf30f809a5bab076cc` |

Chain A→B→C→D intact prior to merge.

`GATE_MERGE_PASS`

---

## 3. Production Deployment

| Field | Value |
| --- | --- |
| Project | `homecheff-app` (`prj_V0aZoSgSjd8dJKM0YtWkAKI88NLV`) |
| Deployment ID | `dpl_E5ZY7VK6ewGYB9HtViqgAFq9RbGY` |
| URL | `https://homecheff-6c9yss3rk-sergio-s-projects-f7b64ee1.vercel.app` |
| Target | production · READY |
| Aliases | `homecheff.eu` · `homecheff.nl` · www |
| Created | 2026-08-01 ~13:23 CEST |

`GATE_PRODUCTION_DEPLOYMENT_PASS`

---

## 4. Runtime Hash

| Field | Value |
| --- | --- |
| Expected merge | `0b84f593b3dda5cbe2e54adf30f809a5bab076cc` |
| Vercel `gitCommitSha` | `0b84f593b3dda5cbe2e54adf30f809a5bab076cc` |
| Live alias dpl | `dpl_E5ZY7VK6ewGYB9HtViqgAFq9RbGY` (eu/nl/www) |
| Rollback baseline | `ea1ff2f5c50e4e7d43ac1d0394f37d5ea0acb409` |

`GATE_RUNTIME_HASH_PASS`

---

## 5. Live Browser Proof

Base: `https://homecheff.eu`

| Probe | Verdict | Score |
| --- | --- | --- |
| Landscape posture | `WX_PHASE_1B4_PASS` | 8/8 |
| Nav preservation | `WX_PHASE_1B4_NAV_PRESERVATION_PROOF_PASS` | 12/12 |
| Independent matrix (320–2560 + phone landscapes) | `INDEPENDENT_PROOF_PASS` | 14/14 |

Viewports covered at minimum: 390×844, 844×390, 430×932, 932×430, 740×360, 812×375, 1024×768, 1280×800, 1440×900, 1920×1080, 2560×1440 (plus additional portrait/landscape cases in probes).

Artifacts: `browser-proof.json`, `nav-preservation-browser-proof.json`, `independent-rereview-proof.json`

---

## 6. Navigation Verification

| Check | Result |
| --- | --- |
| Create below-lg landscape | **REACHABLE** via hamburger (`data-wx-mobile-create`) |
| `/mijn-hcp` below-lg landscape | **REACHABLE** (guest → `/login`; authed href `/mijn-hcp`) |
| Canonical Create action | `openCreateFlow` / `requireAuthAction('create','/sell/new')` |
| Portrait bottom nav | Visible / focusable |
| Landscape bottom nav | Collapsed, `aria-hidden`, `inert`, 0 focusable |
| Escape closes hamburger | PASS |
| Desktop lg+ Create | Unchanged |

---

## 7. Landscape Verification

| Check | Result |
| --- | --- |
| Phase | `1b.4` |
| Landscape work posture | Active (`data-wx-landscape-work=1`) |
| Strip | ~200 → 87 (compact) |
| Bottom visual occupancy landscape | 0 |
| Reclaim | **190px MATERIAL** |
| Touch scroll landscape phones | PASS (feed moved) |
| Mount continuity | Stable shell/primary mounts |

---

## 8. Ownership Verification

| Guard | Result |
| --- | --- |
| GeoFeed sole runtime/data owner | Unchanged |
| Controlled Host | Unchanged |
| Mode Engine / Continuity / Capability | Unchanged (diagnostics only for capabilities) |
| Capability visual activation | `0` |
| No posture-driven request / remount | Confirmed in live journey |

---

## 9. Performance Summary

Incremental cost bounded to chrome/presentation + two hamburger rows + Escape listener while open. No feed ownership change, no polling, no layout measurement storm observed. Live touch scroll preserved.

---

## 10. Rollback Verification

| Check | Result |
| --- | --- |
| Rollback target | `ea1ff2f5…` (prior Production) |
| Independent revert of 1B.4 | Yes |
| DB / data migration | None |
| 1B.3 + 1B.2.1 remain after rollback | Yes |
| Phase 1B.5 during rollback | Prohibited |

**CLEAR**

---

## 11. Freeze Summary

| Field | Value |
| --- | --- |
| Status | `PRODUCTION_FROZEN` |
| Pack | `production/production-freeze-pack.json` |
| Markdown | `production/PRODUCTION_FREEZE.md` |
| Bound to | merge `0b84f593…` / dpl `dpl_E5ZY7VK6…` |
| Freeze commit (docs tip) | `29cba5e010764f2f9a35f35ac10b888e034744bf` |
| Runtime merge (unchanged by docs freeze) | `0b84f593b3dda5cbe2e54adf30f809a5bab076cc` |

---

## 12. Remaining Warnings

1. Hard-coded navigation lists remain duplicated — **ACCEPTED_BOUNDED_WARNING**  
2. Dual posture diagnostic sources — **REQUIRES_FUTURE_TRACKING**

Neither blocks Production.

---

## 13. Final Verdict

```
WX_PHASE_1B4_PRODUCTION_SUCCESS
```

---

## Mandatory Stop Gate

**STOP.** Do not begin WX Phase 1B.5. Await explicit approval after this Production freeze.
