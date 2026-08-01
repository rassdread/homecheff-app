# WX Phase 1B.4 — Accessibility Proof (Navigation Remediation)

**Bound to Commit C:** `81765bec4f45067a93acc3d592350d0e2888d580`

| Check | Result |
| --- | --- |
| Landscape bottom nav `display:none` | PASS |
| `aria-hidden=true` on collapsed shell | PASS (browser proof) |
| `inert` on collapsed shell | PASS (DOM attribute) |
| Focusable count in collapsed shell | 0 |
| Hamburger Create visible when menu open | PASS |
| Hamburger `/mijn-hcp` visible when menu open | PASS |
| Escape closes menu | Implemented + journey closes via Escape |
| Desktop Create unchanged (`lg+`) | PASS @ 1280/1440 |
| Portrait bottom nav focusable | PASS |
| No UA/device detection for collapse | PASS |

Screen-reader: collapsed bar excluded via `aria-hidden` + removed from a11y tree by `display:none`; hamburger items remain in tree when open.
