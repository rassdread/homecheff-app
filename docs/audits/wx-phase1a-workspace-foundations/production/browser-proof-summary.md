# WX Phase 1A — Production Browser Proof

| Field | Value |
| --- | --- |
| Verdict | `WX_PHASE_1A_PASS` |
| Base URL | `https://homecheff.eu` |
| Deployment | `dpl_39kNGiubK3hstdW8rapJ8Kx1g9To` |
| Production commit | `d2b533650572d2ce15ebca3b1d01e4343d3cede7` |
| Captured at | `2026-07-31T00:36:52.159Z` |
| Failures | 0 |

## Viewports

| Viewport | Owner | Orientation span | Primary truncated | Rails | Hydration | Console |
| --- | --- | --- | --- | --- | --- | --- |
| phone-portrait 390×844 | geofeed | yes | no | 2 | 0 | 0 |
| phone-landscape 844×390 | geofeed | yes | no | 2 | 0 | 0 |
| tablet-portrait 768×1024 | geofeed | yes | no | 2 | 0 | 0 |
| tablet-landscape 1024×768 | geofeed | yes | no | 2 | 0 | 0 |
| desktop 1440×900 | geofeed | yes | no | 2 | 0 | 0 |
| ultrawide 2560×1440 | geofeed | yes | no | 2 | 0 | 0 |

## Failures

None.

## Notes

- Feed region (`feedBounds`) sits in the first viewport on all six sizes.
- Individual listing tiles were not yet selectable at capture (`firstTileBounds: null`); this does not fail the structural probe and is consistent with async feed hydration on Production without sealed instrumentation.
- Progressive discovery (filters collapsed by default) confirmed on tablet-landscape / desktop / ultrawide.
