# WX Phase 1B.4 — Landscape Work Posture (+ Navigation Remediation)

**Status:** `PRODUCTION_FROZEN`  
**Verdict:** `WX_PHASE_1B4_PRODUCTION_SUCCESS`  
**Implementation verdict (posture):** `WX_PHASE_1B4_PASS`  
**Navigation remediation verdict:** `WX_PHASE_1B4_NAVIGATION_REMEDIATION_COMPLETE`  
**Formal re-review:** `WX_PHASE_1B4_RE_REVIEW_PASS_WITH_WARNINGS`  

| Ref | Hash |
| --- | --- |
| Branch | `wx/phase-1b4-landscape-work-posture` |
| Commit A (posture) | `ad5752d93bd03a0077b0c0aceed78df6895342fe` |
| Commit B (initial evidence) | `be5f7932e431d05e0edbd13f2951d1469336647b` |
| Commit C (nav remediation) | `81765bec4f45067a93acc3d592350d0e2888d580` |
| Commit D (remediation evidence) | `170c21dcce652d0fb4776e5db96ad41c73b79966` |
| Production merge | `0b84f593b3dda5cbe2e54adf30f809a5bab076cc` |
| Deployment | `dpl_E5ZY7VK6ewGYB9HtViqgAFq9RbGY` |
| Rollback | `ea1ff2f5c50e4e7d43ac1d0394f37d5ea0acb409` |

**Not authorized:** WX Phase 1B.5 (await separate approval)  

---

## Formal review blocker (resolved)

Below-lg landscape collapsed the bottom menu and left Create + `/mijn-hcp` without a hamburger path. Prior evidence conflated **mounted** with **reachable**.

## Remediation

- Hamburger Create → canonical `openCreateFlow` / guest `requireAuthAction('create','/sell/new')`
- Hamburger reputation → `/mijn-hcp` (authed) or `/login` (guest)
- Collapsed bottom shell: `hidden` + `aria-hidden` + `inert`
- Escape closes hamburger
- Explicit matrix + 12/12 nav browser proof

## Corrected claims

| Claim | Accurate statement |
| --- | --- |
| Quick Add available | Reachable via hamburger Create in landscape `< lg`; Quick Add host remains mounted for listeners |
| All paths preserved | Proven route-by-route in `NAVIGATION_PRESERVATION_MATRIX.md` |

## Vertical space / scroll (unchanged)

- Strip ~200→87; bottom visual 0 in landscape  
- Material reclaim retained  
- Touch landscape scroll PASS; mounts stable  

## Evidence pack

- `NAVIGATION_PRESERVATION_MATRIX.md`
- `NAV_PRESERVATION_PROOF.md` + `nav-preservation-browser-proof.json`
- `ACCESSIBILITY_PROOF.md`
- `REMEDIATION_MANIFEST.md`
- `landscape-rerun/` (posture probe reconfirm)

## Production evidence

See `production/` — `PROMOTION_REPORT.md`, `PRODUCTION_FREEZE.md`, `production-freeze-pack.json`, live browser proofs.

## Rollback

Redeploy prior runtime `ea1ff2f5…` or revert merge `0b84f593…`. No DB migration. 1B.3 + 1B.2.1 remain after 1B.4 rollback.

## Stop gate

**STOP.** Production frozen. Do not begin WX Phase 1B.5 until separate explicit approval.
