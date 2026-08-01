# WX Phase 1B.4 — Navigation Remediation Manifest

| Field | Value |
| --- | --- |
| Status | `READY_FOR_FORMAL_RE_REVIEW` |
| Branch | `wx/phase-1b4-landscape-work-posture` |
| Commit C | `81765bec4f45067a93acc3d592350d0e2888d580` |
| Commit C parent | `be5f7932e431d05e0edbd13f2951d1469336647b` |
| Prior Commit A | `ad5752d93bd03a0077b0c0aceed78df6895342fe` |
| Prior Commit B | `be5f7932e431d05e0edbd13f2951d1469336647b` |
| Formal review blocked by | Create + `/mijn-hcp` unreachable below lg in landscape |
| Production / rollback | `ea1ff2f5c50e4e7d43ac1d0394f37d5ea0acb409` |
| Merge | no |
| Deploy | no |
| Production freeze | no |
| Phase 1B.5 | no |

## Remediation summary

1. Hamburger Create uses same `openCreateFlow` / `requireAuthAction('create','/sell/new')` as desktop.
2. Hamburger `/mijn-hcp` (or `/login` for guests) with reputation label.
3. Collapsed bottom nav: `hidden` + `aria-hidden` + `inert` on `data-hc-bottom-nav-shell`.
4. Escape closes hamburger.
5. Nav preservation unit tests + browser proof 12/12.

## Unchanged (must remain)

- Landscape bottom collapse and strip compaction (~200→87)
- Material chrome reclaim
- Touch landscape scroll / 1B.2.1 height chain
- Capability visual activation `0`
- GeoFeed / Host / Mode / Continuity ownership
