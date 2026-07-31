# WX Phase 1B.2.1 — Root Cause (before implementation)

**Incident:** Mobile landscape scroll freeze  
**Severity:** PRODUCTION UX BLOCKER  
**Production runtime:** `5fe0da7855ab7bbf9c4bd6a03f3dca80a423acc4`  
**Evidence:** `docs/audits/wx-phase1b21-mobile-landscape-scroll/live-reproduction.json`

---

## Primary root cause (one)

| Field | Value |
| --- | --- |
| **Exact file** | `components/adaptive-workspace/FeedWorkspaceVisibleLayout.tsx` |
| **Exact component / CSS** | Multi-column Workspace frame classes when `plan.supportingPanelCount > 0`: `h-[calc(100dvh-5rem)] max-h-[calc(100dvh-5rem)] overflow-hidden` on the root `<section>`, combined with primary-stage wrappers that do **not** propagate that fixed height to `#homecheff-feed-desktop` |
| **Exact condition** | Phone landscape AvailableSpace with width ≥ `landscapePanelMinWidthPx` (640) → layout resolver sets `supportingPanelCount = 1` → `multiCol === true` → desktop-style clipped frame activates on a short landscape viewport |
| **Exact computed result (live)** | Workspace section: fixed ~`100dvh-5rem` height + `overflow: hidden` + `scrollHeight ≫ clientHeight` but **not** a scroll container. Primary slot host shrinks (e.g. 143px). Feed `#homecheff-feed-desktop`: `overflow-y: auto` but `clientHeight === scrollHeight` (grows with content, e.g. 432px) because Region/Slot/Panel intermediates are `w-full min-w-0` only (no `h-full`/`min-h-0` fill). Content is clipped by the section; no ancestor scrolls the feed. |
| **Why portrait works** | `supportingPanelCount === 0` → no fixed-height / `overflow-hidden` frame → document/window scroll owns vertical motion; feed column is not trapped in a clipped box |
| **Why landscape fails** | Landscape carve-out enables 1 supporting panel → multiCol frame traps feed in `overflow:hidden` without a working inner scroll owner |
| **Why prior browser proof missed it** | 1B.2 continuity proofs checked mount IDs, Mode, filters, and coarse scroll classification — they did not assert that landscape `scrollHeight > clientHeight` on the **feed scroll owner** or that touch/wheel moves `feed.scrollTop` under multiCol. Fresh landscape loads with panels=1 were treated as pass if window scroll moved slightly (hero chrome), masking feed freeze |
| **Fresh-load vs transition-only** | **Both.** Fresh landscape loads (e.g. 740×360) freeze; orientation journey also freezes when entering multiCol landscape. Not limited to stale last-stable dimensions |

### Contributing (secondary)

1. `WorkspaceRegion` / `WorkspaceSlot` / `WorkspacePanel` lack `h-full min-h-0`, breaking percentage/flex height chain into the stage.  
2. Layout bands intentionally give mobile landscape a side panel (≥640), which flips on the desktop frame CSS designed for tall viewports.  
3. Bottom nav / chrome reduce usable height further on short landscape phones.

### Not the cause

- GeoFeed ownership / remount  
- Controlled Host  
- Capability activation (1B.3)  
- Scroll-lock modal  
- pointer-events overlay (center hit-tests stayed in-feed when feed present)

---

## Intended fix direction (not yet applied at write time)

Minimum safe correction:

1. Propagate bounded height from primary slot host → stage → `#homecheff-feed-desktop` when multiCol frame is active (`h-full min-h-0 overflow-hidden` on host + fill wrappers), **or**  
2. Scope the fixed `100dvh` + `overflow-hidden` frame so short mobile-landscape does not clip without an inner scroll owner.

Prefer (1) so tablet/desktop multiCol keeps a single explicit feed scroll owner without redesign.
