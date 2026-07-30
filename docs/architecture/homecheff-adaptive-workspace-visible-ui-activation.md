# Adaptive Workspace — Visible UI Activation (homepage)

## Phase A finding

A completed visible Adaptive Workspace **homepage** interface did **not** exist.
Existing visible AW UI is Settings ON only (`Region→Slot→Panel`). Homepage used
legacy `HomePageClient` sticky CSS grid + null `FeedControlledHostShell`.

## Mechanism (Phase B)

**Selected: B — Controlled slot / child composition**

- GeoFeed remains the sole feed mount and data owner.
- Desktop: AW layout replaces the legacy sticky-grid *children* of GeoFeed
  (`homeComposedLayout` path) using `WorkspaceRegion` / `Slot` / `Panel`.
- Sub-lg landscape: outer AW grid hosts GeoFeed (still one instance) + one
  end panel — without forcing GeoFeed `isDesktopSplit` (avoids mobile null return).
- Rejected: portal / re-parent (identity risk), UA detection, width-only branching.

## Ownership matrix (first visible slice)

| Concern | Before | After |
| --- | --- | --- |
| Request ownership | GeoFeed | GeoFeed |
| Cache ownership | GeoFeed | GeoFeed |
| Pagination ownership | GeoFeed | GeoFeed |
| Filter ownership | GeoFeed | GeoFeed |
| Observer ownership | GeoFeed | GeoFeed |
| Scroll ownership | GeoFeed | GeoFeed |
| Loading / skeletons / tiles | GeoFeed | GeoFeed |
| Feed renderer ownership | GeoFeed | GeoFeed |
| Workspace layout ownership | Legacy CSS grid / none | Adaptive Workspace shell |
| Responsive resolution | `useNarrowViewport` + CSS `lg` | AvailableSpace resolver (+ legacy OFF path) |

Authority state machine `COMMIT_READY→ACTIVE` remains blocked. This slice is
**visibility presentation only**, not host ACTIVE authorization.

## Flag

`HOMECHEFF_FEED_WORKSPACE_VISIBILITY_MODE` = `off` | `shadow` | `preview` | `on`

| Mode | Behavior |
| --- | --- |
| off (default) | Exact current production homepage |
| shadow | Legacy visible layout; no layout DOM delta |
| preview | Visible only with `?awFeedWorkspace=1` |
| on | Visible for all visitors |

Fail closed: missing/invalid → `off`.

Rollback: set env to `off` (or unset) and redeploy / restart.
