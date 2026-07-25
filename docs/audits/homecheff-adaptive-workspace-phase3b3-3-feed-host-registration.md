# Phase 3B.3.3 — Controlled Host Registration

| Field | Value |
|-------|--------|
| Phase | 3B.3.3 |
| Branch | `workspace/phase3b33-controlled-host-registration` |
| Browser proof commit | `4cd026e1c1f95e0b69cb12527563e98f8fde95d8` |
| Browser | Chromium Chrome/131 · production · `NEXT_PUBLIC_FEED_SEALED_BASELINE=1` |
| Decision | **READY FOR PHASE 3B.3.4** |

## 1. Architecture

Workspace formally registers the existing `feed.discovery` legacy mount as a Controlled Host candidate via a **metadata-only** Host Registry. No runtime ownership transfer occurs.

## 2. Registry

| Field | Value |
|-------|--------|
| hostCount | 1 |
| hostId | `feed.discovery.controlled-host` |
| runtimeId | `feed.discovery.legacy-single-mount.v1` |
| registrationState | `registered` |
| owner / writer / renderer | legacy / legacy / legacy |
| containsRuntimeObjects | false |
| containsReactInstances | false |

## 3. Identity

Browser-measured: mount=1, unmount=0, activeInstanceCount=1, rendererRegistrationCount=0. Stable `runtimeId`. No remount.

## 4. Ownership / runtime

`hostActivation=false`, `renderActivation=false`. Shell remains `null`. GeoFeed remains sole renderer/writer/runtime owner. Rollback `prepared-not-active`.

## 5. Browser proof

Artifact: `docs/audits/artifacts/phase3b33/phase3b3-3-feed-host-registration-proof.json`

- New Chromium production run (not reused)
- Proof commit matches implementation commit `4cd026e`
- 20/20 release-blocking invariants PASS
- Forced activation blocked (`PHASE_3B3_3_HOST_REGISTRATION_ONLY`)
- Phase 3B.2 rerun also 20/20 PASS

## 6. Validators / tests

All green: sealed, sealed-browser, dormant-host, shadow-placement, host-registration; unit suites including 9 registration assertions; production sealed build pass.

## 7. Regression risk

Low. Residual risk for 3B.3.4: accidental activation without identity preservation.

## 8. Limits toward 3B.3.4

No hostActivation, no renderActivation, no live rollback executor, no Workspace renderer.

## 9. Decision

**READY FOR PHASE 3B.3.4**
