# Tests

Executed on feature tip and/or merge simulation (`ae8cbb04` tree).

| Suite | Result |
|---|---|
| `npm run test:location-mobile-keyboard` | **21/21 PASS** |
| `npm run test:location-input-repair` | **16/16 PASS** |
| `npm run test:gps-location-repair` | **30/30 PASS** |
| `npm run smoke-check` | **PASS** (BLOB token advisory only) |
| `npm run build` | **PASS** |
| `npm run test:adaptive-workspace-geofeed-authority-transition` | **9 groups PASS** |
| `npm run test:feed-workspace-visibility` | **21 PASS** |

Not claimed: full `test:adaptive-workspace-react` mega-suite (not required; GeoFeed authority + feed visibility run instead).

Merge simulation: same location + GeoFeed AW suites PASS before discard.
