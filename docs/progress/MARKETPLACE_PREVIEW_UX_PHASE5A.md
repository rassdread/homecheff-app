# Marketplace Preview UX — Phase 5A

**Status:** Complete  
**Scope:** Intentional preview behaviour, tile interaction refinements

## Problem

Previews opened too quickly — accidental hover, long-press, and scroll interference during browsing.

## Solution

Centralized preview state, longer delays, explicit info button, scroll protection.

## Delivered

### 5A-A — Desktop hover

| Rule | Value |
|------|-------|
| Hover delay | **600ms** (`PREVIEW_HOVER_DELAY_MS`) |
| Scroll cooldown | **500ms** after scroll stops |
| Tile visibility | `IntersectionObserver` (25% threshold) |
| On leave | Immediate close |
| During scroll | No opens; active preview closes |

Hover never opens directly — always waits for delay + still cursor + visible tile + no scroll.

### 5A-B — Info button

- `MarketplacePreviewInfoButton` — top-right on tile media (ⓘ Lucide `Info`)
- Click toggles preview open/close
- `data-preview-ignore` — excluded from long-press
- Wired via `TileMedia.showPreviewInfo` on Compact + Standard tiles

### 5A-C — Long press

| Platform | Behaviour |
|----------|-----------|
| Desktop | Disabled (narrow viewport only) |
| Mobile | **700ms** minimum |
| Movement | Cancel if > **12px** |
| Scroll | Cancel + block while scrolling |

### 5A-D — Preview state manager

`lib/marketplace/preview/preview-state-manager.ts`

- Single active preview globally
- Scroll listener with cooldown
- Open source tracking (`hover` | `info_click` | `long_press`)
- Close reason tracking (`leave`, `escape`, `info_click`, `backdrop`, `swipe`, `scroll`, `external`, `replaced`)
- Close event subscribers for analytics

### 5A-E — Analytics

| Event | Properties |
|-------|------------|
| `marketplace_preview_open` | source, listing_id, device, category |
| `marketplace_preview_close` | source, listing_id, device, category, open_duration_ms, close_reason |
| `marketplace_preview_info_click` | listing_id, device, category, will_open |

### 5A-F — Accessibility

- Info button: focusable, `aria-expanded`, `aria-controls`, Enter + Space
- Preview dialog: `aria-label`, Escape to close
- Removed shell `tabIndex` trap (keyboard via info button)

### 5A-G — Mobile review

- Info button in thumb-reach zone (top-right, 32px tap target)
- Bottom sheet unchanged: swipe down, backdrop tap, X button
- Long-press suppressed during scroll/movement
- Feed scroll not blocked unless preview sheet is open

## Key files

| Layer | Path |
|-------|------|
| Constants | `lib/marketplace/preview/preview-constants.ts` |
| State | `lib/marketplace/preview/preview-state-manager.ts` |
| Analytics | `lib/marketplace/preview/preview-analytics.ts` |
| Shell | `components/marketplace/previews/MarketplacePreviewShell.tsx` |
| Info button | `components/marketplace/previews/MarketplacePreviewInfoButton.tsx` |
| Tile media | `components/marketplace/tiles/primitives/TileMedia.tsx` |

## Validation

```bash
npx tsx scripts/validate-marketplace-preview-ux.ts
npx tsx scripts/validate-marketplace-previews.ts
```

## Out of scope

Notifications, exchange acceptance, ranking, search, multi-step chains, sponsored modules.
