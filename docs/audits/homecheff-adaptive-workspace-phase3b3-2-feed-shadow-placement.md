# Phase 3B.3.2 — Controlled Host Shadow Placement

| Field | Value |
|-------|--------|
| Phase | 3B.3.2 |
| Branch | `workspace/phase3b32-controlled-host-shadow-placement` |
| Branch tip | `workspace/phase3b32-controlled-host-shadow-placement` @ single squashed commit |
| Browser proof commit | `ad5cef0782371290f7415a18238a711d0cad35af` (Chromium session; tip only differs by artifact packaging / audit text — no runtime delta vs served tree) |
| Browser | Chromium Chrome/131 · production · `NEXT_PUBLIC_FEED_SEALED_BASELINE=1` |
| Decision | **READY FOR PHASE 3B.3.3** |

## 1. Architecture

Workspace registers and positions the existing `feed.discovery` legacy mount as a **Controlled Host candidate** via:

- Shadow placement contract (`sibling-after-legacy-mount`, `shadow-registered`)
- Identity contract (mount=1, unmount=0, renderer registrations=0, legacy owner/writer)
- Activation gate (`allowed: false`, blocker `PHASE_3B3_2_SHADOW_PLACEMENT_ONLY`)
- Null host shell placed as a **sibling after** `<GeoFeed>` (preserves GeoFeed React sibling index)

GeoFeed remains sole renderer, writer, and owner of requests, identity, pagination, observers, caches, filters, loading, skeletons, tiles, and scroll.

## 2. Runtime

| Flag | Value |
|------|-------|
| hostActivation | `false` |
| renderActivation | `false` |
| Shell DOM | always `null` |
| Second GeoFeed | none |
| Rollback | `prepared-not-active` (no executor) |

## 3. Identity

Browser-measured:

| Metric | Value |
|--------|-------|
| mountCount | 1 |
| unmountCount | 0 |
| activeInstanceCount | 1 |
| rendererRegistrationCount | 0 |
| activeWriter / renderOwner | legacy / legacy |

Shell appears **after** `</GeoFeed>` so React does not remount GeoFeed.

## 4. Browser proof

Artifact: `docs/audits/artifacts/phase3b32/phase3b3-2-feed-shadow-placement-proof.json`

- New Chromium production run (not a reuse of 3B.3.1)
- Proof `commit` = `ad5cef0…` (Chromium session against that tree; branch tip packaging-only delta — no runtime code change)
- 20/20 release-blocking invariants **PASS**
- Shadow placement metadata visible via probe v3 (`readShadowPlacement`)
- Forced activation blocked (`PHASE_3B3_2_SHADOW_PLACEMENT_ONLY`)
- Phase 3B.2 rerun also 20/20 **PASS**

## 5. Validators / tests

| Check | Result |
|-------|--------|
| `validate:adaptive-workspace-feed-shadow-placement` | ok |
| `validate:adaptive-workspace-feed-dormant-host` | ok |
| `validate:adaptive-workspace-feed-sealed` | ok |
| `validate:adaptive-workspace-feed-sealed-browser` | ok (freeze aligned to 3B.2 rerun) |
| `test:adaptive-workspace-feed-shadow-placement` | 8 assertions ok |
| `test:adaptive-workspace-feed-dormant-host` | 8 assertions ok |
| Production build (`NEXT_PUBLIC_FEED_SEALED_BASELINE=1`) | pass |

## 6. Regression risk

Low for Feed runtime: no GeoFeed API/DOM ownership change. Residual risk is accidental future wrap/remount of GeoFeed in 3B.3.3.

## 7. Remaining limits toward 3B.3.3

- No hostActivation
- No renderActivation
- No live rollback executor
- No Workspace renderer

## 8. Decision

**READY FOR PHASE 3B.3.3**
