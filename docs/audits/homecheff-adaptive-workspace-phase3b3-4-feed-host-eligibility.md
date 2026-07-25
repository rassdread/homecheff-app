# Phase 3B.3.4 — Controlled Host Eligibility

| Field | Value |
|-------|--------|
| Phase | 3B.3.4 |
| Branch | `workspace/phase3b34-controlled-host-eligibility` |
| Browser proof commit | _(filled after Chromium proof)_ |
| Browser | Chromium · production · `NEXT_PUBLIC_FEED_SEALED_BASELINE=1` |
| Decision | **PENDING** |

## 1. Architecture

Workspace evaluates whether the single registered Controlled Host candidate qualifies for *future* activation. Eligibility is metadata-only. GeoFeed remains sole owner of rendering, writer, request lifecycle, pagination, observers, caches, filters, loading, skeletons, tiles, scroll, SSR, and hydration.

`hostActivation=false`, `renderActivation=false`. No ownership transfer. No activation path opens.

## 2. Eligibility model

| Field | Value |
|-------|--------|
| hostId | `feed.discovery.controlled-host` |
| runtimeId | `feed.discovery.legacy-single-mount.v1` |
| registrationState | `registered` |
| eligibilityState | `eligible` |
| eligibilityReason | `registered-stable-legacy-host-prerequisites-met` |
| owner / writer / renderer | legacy / legacy / legacy |
| activationState | `dormant` |
| rollbackState | `prepared-not-active` |
| canStartActivation | false |
| activationBlocker | `PHASE_3B3_4_HOST_ELIGIBILITY_ONLY` |
| nextEligibleStep | `3B.3.5` |

## 3. Registry

Unchanged from 3B.3.3: metadata-only registry, `hostCount=1`, no runtime objects, no React instances. Eligibility is a separate evaluation layer over the registry.

## 4. Identity

Required and browser-proven: `runtimeId` stable, React identity stable, mount=1, unmount=0, owner/writer/renderer remain legacy.

## 5. Ownership / runtime

Workspace owns registry metadata, eligibility metadata, diagnostics, and planning only. Shell remains `return null`. Forced activation remains fail-closed.

## 6. Browser proof

Artifact: `docs/audits/artifacts/phase3b34/phase3b3-4-feed-host-eligibility-proof.json`

- New Chromium production run (not reused)
- 20/20 release-blocking invariants
- Eligibility metadata visible via probe `readHostEligibility` (v5)
- Forced activation blocked (`PHASE_3B3_4_HOST_ELIGIBILITY_ONLY`)
- Phase 3B.2 rerun also required 20/20

## 7. Validators / tests

- `validate:adaptive-workspace-feed-eligibility`
- Prior validators (sealed, sealed-browser, dormant, shadow, host-registration) remain green
- `test:adaptive-workspace-feed-eligibility` plus prior unit suites

## 8. Regression risk

Low for runtime/DOM. Residual risk for 3B.3.5: treating eligibility as permission to activate without identity-preserving activation gates.

## 9. Limits toward 3B.3.5

No hostActivation, no renderActivation, no Workspace renderer, no live rollback executor, no second GeoFeed, no remount.

## 10. Decision

**PENDING — complete after green Chromium proof**
