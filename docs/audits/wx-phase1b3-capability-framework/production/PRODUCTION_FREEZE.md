# WX Phase 1B.3 — Production Freeze

**Status:** `PRODUCTION_FROZEN`  
**Final verdict:** `WX_PHASE_1B3_PRODUCTION_SUCCESS`  
**Frozen at (UTC):** see `production-freeze-pack.json`  
**Phase 1B.4:** **not authorized**

---

## Runtime identity

| Field | Value |
| --- | --- |
| Merge commit (Production runtime) | `ea1ff2f5c50e4e7d43ac1d0394f37d5ea0acb409` |
| Merge parents | `86d0b08d…` + `ca5d7802…` |
| Official Vercel project | `homecheff-app` |
| Deployment ID | `dpl_4Jzojsy82dKdZjExmFesxKZmTaGu` |
| Deployment URL | `https://homecheff-fp2iqi61i-sergio-s-projects-f7b64ee1.vercel.app` |
| Aliases | `https://homecheff.eu` · `https://homecheff.nl` (+ www) |
| Runtime-observed git SHA | `ea1ff2f5c50e4e7d43ac1d0394f37d5ea0acb409` |
| Rollback target | `3ddaf59cfd1e95f2276a165cd81807f3de289849` |

Documentation freeze commit is **separate** from the Production runtime merge commit (recorded after this pack is committed).

---

## What is frozen

- Canonical Capability Activation Framework (`wx-capability-activation-v1`)
- 13 capability IDs · states `available` / `unavailable` / `reserved`
- Five permanently reserved capabilities
- Diagnostics-only `data-wx-cap-*` + `data-wx-phase=1b.3`
- Zero visual capability activation
- Preservation of 1B.1 / 1B.2 / 1B.2.1 (including mobile-landscape touch scroll)

---

## Live Production proof summary

| Proof | Result |
| --- | --- |
| Mode matrix (5 Modes incl. Compact) | PASS (8/8) |
| Compact @ measured 662×360 | PASS |
| Capability matrix vs WMS 1.1 mapping | `PRODUCTION_CAPABILITY_MATRIX_MATCH` |
| Presentation non-activation | PASS (visual activation = 0) |
| Landscape touch-drag regression | `WX_PHASE_1B2_1_MOBILE_LANDSCAPE_SCROLL_FIX_PASS` |
| Continuous Mode journey | PASS |
| eu/nl consistency | PASS |
| Console / hydration | 0 / 0 |

---

## Explicit non-authorizations

- No WX Phase 1B.4
- No landscape menu removal/compaction
- No capability UI activation
- No GeoFeed / Controlled Host ownership changes

---

## Rollback

Revert Production runtime to `3ddaf59cfd1e95f2276a165cd81807f3de289849` (merge revert / redeploy). No DB/data migration. 1B.2.1 remains. Capability diagnostics removable safely.
