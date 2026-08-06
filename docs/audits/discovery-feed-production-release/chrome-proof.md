# Chrome Proof

**Runtime:** Playwright Chromium headless against https://homecheff.eu (`dpl_Dn3nNLkTpCXmrcrTzB8itbbA3DyY`)

## Observed

- Homepage loads (HTTP 200); no Security Checkpoint in body.
- Hard gate copy absent: no “Locatie nodig”, no “Kies een plaats … om verder”.
- Feed chrome visible after scroll: “2 results”, “Closest neighbourhood offers first”, category/scope controls present.
- `/api/feed` called (200); sample count ≥ 1 in scrolled session.
- No pageerrors captured.
- Desktop 1280×800 and mobile 390×844: no hard location empty-state.

## Limitations (honest)

- Headless Chromium ≠ interactive Android Chrome permission UI.
- Datacenter IP supplied approximate NL coords → Nearby path used (not pure soft-national zero-coord case).
- Permission deny/block/allow GPS scenarios **not** interactively exercised.
- Search/filter/listing-open click journeys **not** fully operator-run.

**Bounded Chrome result:** no hard location gate; feed UI renders on Production.
