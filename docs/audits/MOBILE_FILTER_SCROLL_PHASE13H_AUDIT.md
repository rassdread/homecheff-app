# Phase 13H Audit — Mobile Homepage Filter Scroll Behavior

**Date:** 2026-07-09  
**Scope:** Mobile feed filter collapse on scroll — UX only. No filter logic, API, or marketplace architecture changes.

---

## Problem

`FeedMobileToolbar` used `sticky top-[3.25rem]` with the full multi-row chip/sort UI. While scrolling the feed on mobile/Capacitor, the filter block stayed large and visually dominant.

## Solution

| Behavior | Implementation |
|----------|----------------|
| Scroll down | Collapse to compact sticky bar after 64px (`useMobileFeedFilterScroll`) |
| Scroll to top | Expand full toolbar when `scrollY ≤ 24px` |
| Tap collapsed bar | `onOpenFilters()` → existing `FeedMobileFilterSheet` |
| Active filters | Badge count + truncated chip summary when collapsed |
| Desktop | Unchanged — toolbar only renders when `feedCompactChrome` |

## Files

| File | Change |
|------|--------|
| `hooks/useMobileFeedFilterScroll.ts` | Passive `window` scroll listener, rAF throttle |
| `components/feed/FeedMobileToolbar.tsx` | `collapsed` + `activeFilterCount`; compact vs expanded UI |
| `components/feed/GeoFeed.tsx` | Wire hook when `mobileFilterScrollEnabled` |
| `public/i18n/en.json`, `nl.json` | `feed.mobileFilterCollapsedAria*` |

## Unchanged

- `FeedMobileFilterSheet` — focus trap, apply/clear, filter state
- Feed fetch, cache, `feedSurfaceState`, filter application logic
- Desktop `FeedSidebarFilters` / sticky grid
- `ImprovedFilterBar` (non-compact paths)

## Accessibility

- `aria-label` on collapsed filter button (with active count)
- `aria-expanded` on toolbar container
- Filter sheet Escape + focus restore unchanged

## Performance

- Passive scroll listener
- `requestAnimationFrame` coalescing — no per-scroll React updates beyond collapse toggle
- No GeoFeed remount; only `FeedMobileToolbar` re-renders on collapse state change

---

## Verdict

**Complete** — mobile filter minimizes on scroll, reopens via tap, expands at top. Desktop unaffected.
