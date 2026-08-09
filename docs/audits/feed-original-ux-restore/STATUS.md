# Original feed UX restore — status

## Verdict (pre-production deploy of this branch)

`HOMECHEFF_ORIGINAL_FEED_UX_NO_GO`

Reason: selective restore is implemented and unit-gated, but **not yet deployed** to https://homecheff.eu. Production visual RESTORED certification is blocked until deploy + re-run of `scripts/certify-original-feed-ux.mjs`.

## Phase 1 findings (confirmed)

| Item | Value |
|------|--------|
| Last known-good feed UX | `5d500f3d` |
| CTA known-good | `5d500f3d` (CTA modules unchanged through HEAD) |
| Infinite-scroll known-good | `5d500f3d` (+ composition `062e94f0` / `7887df17`) |
| CTA “removed” commit | **None** — code intact; visibility issues correlated with `d70f8cf6` radius-strict primary pool |
| Regression commit | `d70f8cf6` |

## Production probe (2026-08-09, pre-deploy)

- Mobile feed **does** contain interstitial CTAs (verticals, pulse, Google Play promo, affiliate, share, werken-bij) inside `div.contents`.
- Infinite scroll on Chromium mobile/desktop **can** grow unique listing hrefs after scroll (fc14a950 recovery helps).
- Primary composition still uses radius-strict pool on production until this branch deploys.

## This branch restores

- Progressive Nearby primary pool (`composeProgressiveNearbySalePool`) as at `5d500f3d`
- `progressiveWidenActive` signal
- Keeps instant radius, broadened pagination, search context, public hrefs, media/auth fixes
- Adds `data-hc-feed-insert` markers for reliable cert

## Next

1. Commit + push `fix/restore-original-feed-ux`
2. Deploy production
3. Re-run browser cert (Chromium desktop/mobile; WebKit if available)
4. Only then may verdict become `HOMECHEFF_ORIGINAL_FEED_UX_RESTORED`
