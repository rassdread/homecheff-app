# WX Phase 1C — Responsive Matrix

| Feedback requirement | Implementation | Proof |
| --- | --- | --- |
| Landscape is a real work posture | 1B.4 posture + 1C chrome reclaim | `bottomNavCollapsed=1`, `chromeBottomRem=0` |
| Portrait optimized for browsing | Single column, document scroll, bottom nav | phone-portrait PASS |
| Landscape maximizes usable workspace | Frame height `100dvh - 3.5rem` | landscape viewport heights |
| Mobile landscape no wasted vertical pixels | Compact orientation strip + bottom reclaim | orientationCompact=1 |
| Bottom nav never wastes landscape workspace | Collapsed + zero bottom inset | landscape checks |
| Side rails only with AvailableSpace | Existing layout bands / carve-out | rails matrix |
| Hero/header never cramped | Compact strip retains title + meta | orientation strip present |
| Create always discoverable | `data-wx-primary-action` | createReachable |
| Search/filters obvious | Mobile toolbar / stage chrome / rail portal | searchOrFiltersReachable |
| Feed visual primary | Stage + capped feed column | feedPresent |
| No duplicate nav paths | Bottom collapsed in landscape; single Create command | posture |
| No floating orphan controls | Filters portal into rail host | filter portal on laptop+ |
| No unexplained whitespace | Stage gutter fill when multi-col | `data-wx-stage-gutter` |
| Stable scrolling / mounts / transitions | Continuity keys; remount=0 | rotation proof |
