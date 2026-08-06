# Reproduced Failure

## Live Production attempt

- Route: `https://homecheff.eu/`
- Agent browser hit **Vercel Security Checkpoint (Code 10)** — feed DOM not reachable for headless Chromium.
- Interactive Production proof therefore incomplete for this session.

## Source reproduction (blocking layer)

| Check | Result |
|-------|--------|
| Exact CTA | Location refine banner `changeLabel` (“Wijzig locatie”) / choose-place → `handleChoosePlaceForNearby` |
| Place input SSOT | `FeedSidebarFilters` / `FeedMobileFilterSheet` / legacy GeoFeed draft input via `placeInputRef` |
| Legacy Discovery Filters | `HomeDesktopLeftSidebar` `filtersOpen` defaulted to **false** |
| Input in DOM when collapsed | **No** — `{filtersOpen ? <FeedFiltersPanel /> : null}` |
| `disabled` / `readOnly` on place input | Not set (input missing, not disabled) |
| Focus result | `placeInputRef.current` null → no-op |
| Overlay / pointer-events | N/A while unmounted |
| Mobile sheet | Autofocused close button; place focus raced |

User-visible symptom: place/postcode control “closed” / not typeable after choosing place.
