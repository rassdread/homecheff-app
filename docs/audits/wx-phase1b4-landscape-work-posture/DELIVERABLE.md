# WX Phase 1B.4 — Landscape Work Posture (+ Navigation Remediation)

**Status:** `READY_FOR_FORMAL_RE_REVIEW`  
**Implementation verdict (posture):** `WX_PHASE_1B4_PASS`  
**Navigation remediation verdict:** `WX_PHASE_1B4_NAVIGATION_REMEDIATION_COMPLETE`  

| Ref | Hash |
| --- | --- |
| Branch | `wx/phase-1b4-landscape-work-posture` |
| Commit A (posture) | `ad5752d93bd03a0077b0c0aceed78df6895342fe` |
| Commit B (initial evidence) | `be5f7932e431d05e0edbd13f2951d1469336647b` |
| Commit C (nav remediation) | `81765bec4f45067a93acc3d592350d0e2888d580` |
| Production / rollback | `ea1ff2f5c50e4e7d43ac1d0394f37d5ea0acb409` |

**Not claimed:** merge · deploy · Production freeze · WX Phase 1B.5  

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

## Rollback

Revert feature branch / do not merge. Production remains `ea1ff2f5…`. No DB migration. 1B.3 + 1B.2.1 remain live after rollback of 1B.4.

## Stop gate

**STOP.** Await formal re-review. No merge, deploy, freeze, or 1B.5.
