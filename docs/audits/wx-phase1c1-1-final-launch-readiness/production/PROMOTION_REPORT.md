# WX Phase 1C.1.1 — Promotion Report

## Merge

- Strategy: `git merge --no-ff`
- Source tip: `5c93df36` (includes behavioural `a692eea4` + Formal Review docs)
- Into: `origin/main` previously at `7e09a3c9`
- Merge SHA: `1a68350d12f005142e1d2f6dbc078bfd9f4ab9d3`
- Parents: `7e09a3c9…` + `5c93df36…`
- Conflicts: none
- Force push: no
- Feature branch retained

## Activation

- Variable: `HOMECHEFF_FEED_WORKSPACE_VISIBILITY_MODE`
- Environment: Production only (homecheff-app)
- Target: `on`
- Pre-merge live: phase `1b.5.9` workspace shell already visible (env was present)
- Post-set: explicitly updated to `on`
- Does not activate Controlled Host / GeoFeed ownership transfer

## Deployment

- Official project confirmed: `homecheff-app` / `prj_V0aZoSgSjd8dJKM0YtWkAKI88NLV`
- GitHub Production deploy READY: `dpl_HGC4ntZiejccrKBFeAnM5MaTSzfW`
- CLI Production deploy READY & currently aliased: `dpl_CE1ro9swU8x34Vsj36yHaB5SzZ7s`
- Both built from merge `1a68350d`
- Aliases: homecheff.eu, www.homecheff.eu, homecheff.nl → 307 → homecheff.eu, www.homecheff.nl → 307 → homecheff.eu

## Gates

All mandatory gates 1–14 passed with live proof on https://homecheff.eu.
