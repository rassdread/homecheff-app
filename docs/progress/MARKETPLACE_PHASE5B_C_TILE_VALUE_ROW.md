# Phase 5B-C — Tile Value Row + Accepted Value Subcategory Icons

**Status:** Implemented  
**Depends on:** 5B-A taxonomy fields, 5B-B icon wiring, 5B-D barter openness

## Summary

Marketplace tiles now surface the HomeCheff value economy in one scan:

- **Media overlay:** main offer category (🍳 HomeCheff, 🌱 HomeGarden, 🙋 Gezocht, …)
- **Value row:** price + 💶 / 🤝 indicators
- **Accepted icons:** compact subcategory Lucide/emoji icons with aria-labels + desktop tooltips

## Deliverables

| Area | Implementation |
|------|----------------|
| Value row | `lib/marketplace/tiles/build-tile-value-row.ts` + `TileValueRow` |
| Accepted icons | `lib/marketplace/tiles/build-tile-accepted-value-icons.ts` + `TileAcceptedValueIcons` |
| Offer category badge | `resolve-tile-offer-category-badge.ts` → `offer_category` media badge |
| Tile wiring | `TileValueExchangeBlock` in compact / standard / mini / sidebar |
| Analytics | `marketplace_tile_value_row_seen` via `tile-value-analytics.ts` |
| i18n | `marketplace.tile.valueRow.*`, `marketplace.tile.acceptedValues.*` (nl + en) |
| Validation | `scripts/validate-marketplace-tile-value-row.ts` |

## Density

| Variant | Value row | Accepted icons | Trust signals |
|---------|-----------|----------------|---------------|
| Compact | ✓ | max 2 | max 2 |
| Standard | ✓ | max 4 | max 3 |
| Mini | ✓ (no accepted icons) | hidden | max 1 |
| Sidebar | ✓ | max 2 | — |

## Chain consistency

- **Tile** — scan summary only  
- **Preview / detail / proposal** — full labels, conditions, settlement (unchanged)

## Validation

```bash
npx tsx scripts/validate-marketplace-tile-value-row.ts
npx tsx scripts/validate-marketplace-tile-system.ts
```
