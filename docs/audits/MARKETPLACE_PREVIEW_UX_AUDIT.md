# Marketplace Preview UX Audit — Phase 5A

**Date:** 2026-07-06  
**Phase:** 5A — Preview behaviour + tile interaction  
**Prior:** T3 preview layer (300ms hover, 500ms long-press)

## Summary

Preview opening is now intentional: 600ms hover delay, 700ms mobile long-press, scroll cooldown, explicit info button, and global single-preview coordination.

## Behaviour matrix

| Trigger | Desktop | Mobile |
|---------|---------|--------|
| Hover | 600ms delay, visibility + scroll guards | N/A |
| Info button (ⓘ) | Toggle open/close | Toggle open/close |
| Long press | Disabled | 700ms, cancel on move >12px or scroll |
| Focus on shell | Removed (was 300ms open) | N/A |
| Escape | Closes hover preview | Closes bottom sheet |
| Scroll | Blocks opens; closes active preview | Cancels long-press; closes active preview |

## Timing comparison

| Constant | T3 (before) | 5A (after) |
|----------|-------------|------------|
| Hover delay | 300ms | **600ms** |
| Long press | 500ms | **700ms** |
| Scroll cooldown | none | **500ms** |
| Move cancel | any touch move | **>12px** |

## Single preview rule — verified

- `previewStateManager` holds one `activeListingId`
- Opening a second preview closes the first with reason `replaced`
- All tiles subscribe to manager state

## Scroll protection — verified

- Global `scroll` listener (capture, passive)
- `isScrolling` true during scroll + 500ms debounce after stop
- `canHoverOpen()` returns false while scrolling
- Active preview closed on scroll with reason `scroll`

## Info button — verified

| Check | Status |
|-------|--------|
| Top-right on tile media | ✓ |
| `data-preview-ignore` | ✓ |
| Click toggle | ✓ |
| Enter / Space | ✓ |
| `aria-expanded` + `aria-controls` | ✓ |
| i18n en/nl | ✓ |

## Analytics — verified

| Event | Fired when |
|-------|------------|
| `marketplace_preview_open` | Preview opens (any source) |
| `marketplace_preview_close` | Preview closes (with duration + reason) |
| `marketplace_preview_info_click` | Info button clicked |

## Accessibility — verified

| Check | Status |
|-------|--------|
| Info button keyboard | ✓ |
| Escape closes preview | ✓ |
| `role="dialog"` + `aria-label` | ✓ |
| No shell tab trap | ✓ |

## Mobile UX — verified

| Check | Status |
|-------|--------|
| Long-press only on narrow viewport | ✓ |
| Bottom sheet swipe close (72px) | ✓ (unchanged) |
| Body scroll lock when sheet open | ✓ |
| Feed scroll unaffected when closed | ✓ |
| Info button 32px tap target | ✓ |

## Files changed

**New**

- `lib/marketplace/preview/preview-constants.ts`
- `lib/marketplace/preview/preview-state-manager.ts`
- `lib/marketplace/preview/preview-analytics.ts`
- `lib/marketplace/preview/index.ts`
- `components/marketplace/previews/MarketplacePreviewInfoButton.tsx`
- `components/marketplace/previews/MarketplacePreviewShellContext.tsx`
- `scripts/validate-marketplace-preview-ux.ts`

**Modified**

- `components/marketplace/previews/MarketplacePreviewShell.tsx` — full rewrite of trigger logic
- `components/marketplace/previews/MarketplaceHoverPreview.tsx` — `previewId` for aria-controls
- `components/marketplace/previews/MarketplaceLongPressPreview.tsx` — close reasons
- `components/marketplace/tiles/primitives/TileMedia.tsx` — info button placement
- `components/marketplace/tiles/MarketplaceTileCompact.tsx`
- `components/marketplace/tiles/MarketplaceTileStandard.tsx`
- `public/i18n/en.json`, `public/i18n/nl.json`
- `scripts/validate-marketplace-previews.ts` — timing assertion update

## Validation commands

```bash
npx tsx scripts/validate-marketplace-preview-ux.ts
npx tsx scripts/validate-marketplace-previews.ts
npm run build
```

## Known limitations

- Hover preview still available on desktop (delayed) — info button is the primary intentional path
- No haptic feedback on long-press (spec gap from T3 architecture doc)
- Mini/Sidebar tiles still have no preview (unchanged from T3)
