# WX Phase 1B.4 — Navigation Preservation Matrix

**Bound to Commit C:** `81765bec4f45067a93acc3d592350d0e2888d580`  
**Contract:** landscape bottom nav collapsed; destinations via below-lg hamburger  

| Destination | Canonical | Portrait | Landscape `< lg` | Desktop `lg+` | Auth | Keyboard | Touch | Result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home | `/` | Bottom Discover + hamburger | Hamburger | Top nav | any | yes | yes | PASS |
| Create / Quick Add | `openCreateFlow` / `requireAuthAction('create','/sell/new')` | Bottom Plus | Hamburger Create (`data-wx-mobile-create`) | Top Create | guest→auth | yes | yes | PASS |
| Reputation | `/mijn-hcp` | Bottom tab | Hamburger (`data-wx-mobile-mijn-hcp`) → `/mijn-hcp` or `/login` | Top + profile menu | guest→login | yes | yes | PASS |
| Messages | `/messages` | Bottom tab | Hamburger (authed block) / login CTAs | Top | guest→login | yes | yes | PASS |
| Profile | `/profile` | Bottom + hamburger | Hamburger | Top | guest→login | yes | yes | PASS |
| Settings | `/settings` | Hamburger (authed) | Hamburger (authed) | Profile menu | authed | yes | yes | PASS |
| Login / Logout | `/login` / logout action | NavBar + hamburger | Same | Same | — | yes | yes | PASS |
| Dashboard | role href | Bottom (ops) + hamburger | Hamburger (authed) | Top | ops roles | yes | yes | PASS |

**Distinctions (corrected vs prior overclaims):**

| State | Create in landscape `< lg` | Bottom nav in landscape |
| --- | --- | --- |
| Mounted | Quick Add listeners remain mounted | Shell remains mounted |
| Visually visible | Create row in open hamburger | Collapsed (`display:none`) |
| Keyboard reachable | Yes (menu items) | No (`aria-hidden` + `inert` + hidden) |
| Pointer/touch reachable | Yes | No |
| Invoked | Create click → canonical flow | N/A |

Future debt: desktop / bottom / hamburger destination lists remain separately hard-coded (no full IA refactor in 1B.4).
