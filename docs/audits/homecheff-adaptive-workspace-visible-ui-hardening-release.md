# Adaptive Workspace — Production Activation Hardening Release Pack

## Verdict

`READY_TO_MERGE_FOR_CONTROLLED_PRODUCTION_ACTIVATION`

Production ON was **not** enabled. Vercel env was **not** changed. Main was **not** merged.

## Baseline

| Field | Value |
| --- | --- |
| Branch | `phase-aw-visible-workspace-preview` |
| Start tip | `82df73d944a6ba0b0a2e4cf6928304e039bb2990` |
| Tip after hardening | see `git log -1` on branch |
| origin/main | `929bc67ca25a037f9d2e53c5606f5e695e0ab6d1` (ancestor; no conflicting main commits) |

## Remount root cause (fixed)

PREVIEW previously branched:

- Desktop: `GeoFeed` **parent** of `FeedWorkspaceVisibleLayout`
- Sub-lg: `GeoFeed` **child** of `FeedWorkspaceVisibleLayout`

Crossing `lg` swapped GeoFeed’s React parent → remount.

## Stable architecture

```
FeedControlledHostShell
  └ FeedWorkspaceVisibleLayout
       ├ slot start (CSS-hidden when unused)
       ├ slot primary → GeoFeed (homeComposedLayout=false)  [permanent]
       └ slot end (CSS-hidden when unused)
```

OFF keeps the legacy sticky-grid tree + null shell.

## Ultra-wide

- PREVIEW/ON page shell: `max-w-none` (full AvailableSpace)
- Feed column: `feedColumnMaxWidthPx=720` (readable)
- Rails consume remaining width
- QHD proof: usableWidth≈2528, feedW=720, mode=`desktop-wide`

## Chromium proof (sealed baseline)

- Initial-load matrix: 11 viewports — PASS (mount=1, unmount=0)
- Continuous resize journey: PASS (mount=1 throughout, unmount=0, requestKeyTx=0)
- OFF parity: no AW markers; legacy sticky present
- Artifacts: `docs/audits/artifacts/aw-visible-workspace-preview/`

## Sealed import warnings

Build still emits historical `Attempted import error` warnings in sealed host identity modules. Classified as **known sealed-metadata debt**, not a homepage presentation blocker (build Ready; runtime path unused for visibility).

## Controlled activation procedure (do not execute yet)

1. Merge branch into `main` (`--no-ff` recommended).
2. Deploy main with visibility mode **unset/off**.
3. Verify production OFF parity.
4. Set **Preview** env `HOMECHEFF_FEED_WORKSPACE_VISIBILITY_MODE=preview`; prove on Vercel Preview URL with `?awFeedWorkspace=1`.
5. After Preview passes, set Production `HOMECHEFF_FEED_WORKSPACE_VISIBILITY_MODE=on`.
6. Redeploy Production; smoke test.
7. Rollback: set `off` or unset → redeploy immediately.

## Proposed merge commands (manual)

```bash
git checkout main
git pull origin main
git merge --no-ff phase-aw-visible-workspace-preview -m "merge(workspace): visible Adaptive Workspace preview (presentation-only)"
git push origin main
```

Post-merge verify:

```bash
# Production must still be OFF until env change
curl -sI https://homecheff.eu | head
# After preview env only:
# open Vercel Preview /?awFeedWorkspace=1
```

Rollback:

```text
Vercel Production → HOMECHEFF_FEED_WORKSPACE_VISIBILITY_MODE=off (or delete) → Redeploy
```
