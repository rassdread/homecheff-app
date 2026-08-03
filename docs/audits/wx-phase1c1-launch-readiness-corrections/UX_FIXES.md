# UX Fixes

## P0 — Create never disappears
- Portrait: bottom FAB is primary Create (`data-wx-bottom-create` + `data-wx-primary-action`).
- Landscape: when bottom nav collapses, NavBar shows equally discoverable Create (`data-wx-landscape-create`).
- Desktop/laptop: single NavBar primary Create; left rail is secondary shortcut only.

## P1 — Portrait strip
- Strip reduced to single-row chrome; target ≤12vh (measured ~6–8% portrait).

## P1 — Landscape feed-first
- Category/scope chip rows hidden in work-compact toolbar; search + view chips + filters remain.
- Single-panel layout prefers start (tools/filters) over end (community).

## P1 — Search
- Always-visible search input (`data-wx-feed-search`) above discovery chips.

## P1 — Empty state
- Empty feed guidance with Create, Search, filters, location, scope actions.

## Visual polish
- Ultrawide feed column max 800px (was 720) to reduce gutters without card stretch.
