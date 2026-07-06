# Marketplace Tile T3 — Preview Layer Foundation

**Status:** Complete  
**Last updated:** 2026-07-06  
**Depends on:** T1 (Compact/Standard/Router), T2 (Mini/Sidebar/primitives)

---

## Goal

Secondary information layer without enlarging tile bodies:

- **Desktop:** hover preview (300ms, floating, max 420px)
- **Mobile:** long-press bottom sheet (500ms)

All preview data from `DiscoveryReadModel` → `MarketplaceTileModel` — no extra API calls.

---

## Files added

### UI (`components/marketplace/previews/`)

- `MarketplacePreviewCard.tsx` — canonical preview content
- `MarketplaceHoverPreview.tsx` — desktop floating panel
- `MarketplaceLongPressPreview.tsx` — mobile bottom sheet
- `MarketplacePreviewShell.tsx` — trigger orchestration
- `MarketplacePreviewActions.tsx` — view / message / favorite
- `compute-preview-position.ts` — viewport-safe positioning
- `preview-fulfillment-icons.tsx` — fulfillment icon row

### Lib (`lib/marketplace/previews/`)

- `build-preview-content.ts` — per-ListingKind matrix
- `build-preview-payment.ts` — value explanation block
- `build-preview-fulfillment.ts` — fulfillment flags → icon row
- `build-preview-accepted.ts` — accepted values (max 6 + overflow)
- `build-preview-trust.ts` — expanded trust lines + badges
- `resolve-fulfillment-flags.ts` — flags from delivery mode + kind
- `types.ts` — preview content types

### Tile model extensions

- `fulfillmentFlags`, `capacityRemaining`, `neededBy`
- `trust.repeatCustomers`
- `map-trust.ts` shared trust mapper

---

## Integration

- `MarketplaceTileCompact` + `MarketplaceTileStandard` wrapped in `MarketplacePreviewShell`
- `enablePreview` prop (default `true`)
- Mini / Sidebar unchanged (no preview triggers)

---

## i18n

`marketplace.preview.*` keys in `public/i18n/nl.json` and `en.json`.

---

## Validation & docs

```bash
npx tsx scripts/validate-marketplace-previews.ts
npm run lint
npm run build
```

- `docs/audits/MARKETPLACE_PREVIEW_AUDIT.md`
- `docs/audits/MARKETPLACE_PREVIEW_ACCESSIBILITY.md`

---

## Next phases (not T3)

- Activity cards
- Sponsored placements
- Recommendations
- Preview on Mini/Sidebar (if needed)
