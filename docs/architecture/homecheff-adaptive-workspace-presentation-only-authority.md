# Adaptive Workspace — Presentation-Only Visibility Authority

## Classification

This production-visible slice is:

**PRESENTATION-ONLY WORKSPACE ACTIVATION**

It is **not**:

- Controlled Host runtime ACTIVE
- Request / writer / cache / pagination / observer authority transfer
- GeoFeed retirement

Controlled Host tip remains `COMMIT_READY` with `COMMIT_READY→ACTIVE` blocked.
Do not mutate that state machine for visibility.

## Ownership after visibility ON / PREVIEW

| Concern | Owner |
| --- | --- |
| Requests | GeoFeed |
| Request identity | GeoFeed |
| Cache | GeoFeed |
| Pagination | GeoFeed |
| Filters | GeoFeed |
| Observers | GeoFeed |
| Scroll state | GeoFeed |
| Loading | GeoFeed |
| Skeletons | GeoFeed |
| Tiles | GeoFeed |
| Feed rendering | GeoFeed |
| Workspace presentation layout | Adaptive Workspace |
| AvailableSpace resolution | Adaptive Workspace |
| Panel placement | Adaptive Workspace |
| Runtime activation authority | unchanged (blocked) |
| Writer authority | unchanged (GeoFeed data writer) |
| Controlled Host state | COMMIT_READY |

## Stable mount contract

PREVIEW/ON React tree (permanent):

```
FeedControlledHostShell
  └ FeedWorkspaceVisibleLayout
       ├ slot start (may be CSS-hidden)
       ├ slot primary → GeoFeed (homeComposedLayout=false)
       └ slot end (may be CSS-hidden)
```

OFF React tree (legacy parity):

```
GeoFeed (homeComposedLayout when desktop)
  └ legacy sticky grid children
FeedControlledHostShell → null
```

## Width model

- OFF: `max-w-[1320px]` homepage shell (unchanged).
- PREVIEW/ON: full-bleed Workspace shell (`max-w-none`).
- Primary feed column: readable `feedColumnMaxWidthPx` (default 720) inside its grid area.
- Rails consume remaining AvailableSpace on wide viewports.
