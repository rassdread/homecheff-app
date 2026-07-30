# Adaptive Workspace — Visible UI Preview Proof

## Verdict

`READY_FOR_CONTROLLED_PRODUCTION_ACTIVATION`

Production ON was **not** enabled. Preview path only.

## Branch

`phase-aw-visible-workspace-preview`

## Phase A

No completed visible Adaptive Workspace homepage UI existed before this work.
Only Settings ON and a null `FeedControlledHostShell` were present.

## Mechanism

**B — Controlled slot / child composition**

- Desktop: AW layout as GeoFeed `homeComposedLayout` children
- Sub-lg: outer AW grid hosts one GeoFeed + optional end rail
- No portal / no second GeoFeed / no request-owner transfer

## Flag

`HOMECHEFF_FEED_WORKSPACE_VISIBILITY_MODE=off|shadow|preview|on`

| Mode | Behavior |
| --- | --- |
| off (default) | Exact legacy homepage |
| shadow | Legacy visible layout |
| preview | Visible only with `?awFeedWorkspace=1` |
| on | Visible for all visitors |

Rollback: unset / set `off` and redeploy.

## Automated tests

`npm run test:feed-workspace-visibility` — **17/17 PASS**

## Chromium matrix

Server: `HOMECHEFF_FEED_WORKSPACE_VISIBILITY_MODE=preview npx next start -p 3080`

| Viewport | Layout mode | Orientation | Panels |
| --- | --- | --- | --- |
| 390×844 | mobile-portrait | portrait | 0 |
| 844×390 | tablet-landscape | landscape | 1 |
| 430×932 | mobile-portrait | portrait | 0 |
| 932×430 | tablet-landscape | landscape | 1 |
| 768×1024 | tablet-portrait | portrait | 1 |
| 1024×768 | tablet-landscape | landscape | 1 |
| 1280×800 | desktop | landscape | 2 |
| 1440×900 | desktop | landscape | 2 |
| 1728×1117 | desktop | landscape | 2 |

Notes:

- Measured width is container-constrained (`max-w-[1320px]`), so 1728 CSS viewport may still resolve `desktop` (2 panels) rather than `desktop-wide`.
- OFF path (`/`) verified: no AW workspace/host markers; legacy sticky rails present.

Screenshots: `docs/audits/artifacts/aw-visible-workspace-preview/screenshots/`

Raw report: `docs/audits/artifacts/aw-visible-workspace-preview/chromium-proof.json`

## Production activation

**Not executed.** To activate later:

1. Set Vercel Production `HOMECHEFF_FEED_WORKSPACE_VISIBILITY_MODE=preview` for internal soak, or `on` for full visibility
2. Redeploy
3. Keep rollback: set `off`

Do not flip ON without release-owner confirmation.
