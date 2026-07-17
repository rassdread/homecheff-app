# Geo feed integrity — contract & root cause (fix/geo-feed-integrity)

## Product contract

| Scope | UI | Behavior |
|---|---|---|
| `nearby` | In je buurt | Requires viewer coords/place + radius; **strict** distance filter; never silent national |
| `national` | Heel Nederland | **European mainland NL only** (bbox). SX/CW/AW/BQ excluded even if `country=NL` |
| `international` | Internationaal | Worldwide **including** NL (farthest-first) |

## Root causes (Production `c17f324`)

1. **Client return cache bleed** — `peekFreshHomeFeedReturnCache()` ignored `requestKey`, so a prior national/international snapshot could paint under nearby for ≤60s (and skip network).
2. **National label ≠ filter** — API returned global sales for “Heel Nederland”; Sint Maarten could appear by recency.
3. **Nearby used `local_first`** — far items stayed in the pool; client hard-filter could leave 1–2 tiles; radius 0 disabled filtering.
4. **Android** — Capacitor GPS was debug-only; feed used WebView geolocation; first paint sliced to **2** cards.
5. **R1 (`91b8dfc`→`c17f324`)** — did not introduce national/cache-key bugs; remount/fast-path made cache bleed more visible.

## Fixes in this branch

- Keyed return cache only; clear on scope change; reject stale responses by `requestKey`.
- National mainland filter server-side; nearby strict_local; nearby without location returns no sales.
- Native GPS wired into “use my location”; Android first paint shows full first page.
- Preview/dev diagnostics via `window.__hcGeoFeedDiagReport()` / console `[hc-geo-diag]`.

## Manual Preview

1. Open Preview (SSO if needed).
2. Console: `window.__hcGeoFeedDiagReport?.()`.
3. Switch nearby → national → international → nearby rapidly; confirm `status: "stale"` / accepted scopes match UI.
4. Nearby with Vlaardingen coords: no Sint Maarten cities in diag.
5. Android WebView: use location via Capacitor path; confirm >2 tiles after load.
