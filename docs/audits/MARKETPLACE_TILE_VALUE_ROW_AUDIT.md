# Marketplace Tile Value Row Audit — Phase 5B-C

**Date:** 2026-07-07  
**Validator:** `scripts/validate-marketplace-tile-value-row.ts`

---

## 1. Tile variants with value row

| Variant | Value row | Accepted icon strip |
|---------|-----------|---------------------|
| `MarketplaceTileCompact` | Yes | Yes (max 2) |
| `MarketplaceTileStandard` | Yes | Yes (max 4) |
| `MarketplaceTileMini` | Yes | No (density) |
| `MarketplaceTileSidebar` | Yes | Yes (max 2) |

---

## 2. Money / barter / hybrid display

| `barterOpenness` | Price label | 💶 | 🤝 |
|------------------|-------------|----|----|
| `MONEY` + price | €X | ✓ | if accepted values |
| `MONEY_AND_BARTER` | €X | ✓ | ✓ |
| `BARTER_ONLY` | “Ruil mogelijk” | — | ✓ |
| On request | Prijs op aanvraag | ✓ | per openness |
| REQUEST + budget | Budget €X | ✓ | per openness |
| REQUEST voluntary | Vrijwillige bijdrage | — | ✓ |

Indicators are emoji in the value row (`💶` / `🤝`), not duplicate long text.

---

## 3. Accepted value icon derivation

**Source order:**

1. `acceptedValueSubcategories` (canonical item-level ids)
2. Fallback: `acceptedSpecializations` (taxonomy registry)
3. Fallback: `acceptedValueCategories` → main-category emoji

**Per id:**

1. Subcategory Lucide icon from taxonomy registry  
2. Parent main-category emoji (`MAIN_CATEGORY_REGISTRY`)  
3. Skip if unresolvable — **no placeholders**

---

## 4. Fallback rules

| Case | Icon shown | aria-label names |
|------|------------|------------------|
| Subcategory with icon | Lucide | Subcategory label |
| Subcategory without icon | Parent main emoji | Subcategory label |
| Main category only | Main emoji | Main category label |
| No accepted values | *(render nothing)* | — |

---

## 5. Density rules

| Surface | Accepted icons | Overflow |
|---------|----------------|----------|
| Compact / mobile | 2 | `+N` chip |
| Standard / desktop | 4 | `+N` chip |
| Mini | 0 | — |

No wrapping; `flex-nowrap` on icon strip.

---

## 6. REQUEST vs sale tiles

| Aspect | REQUEST | OFFER |
|--------|---------|-------|
| Media badge | 🙋 Gezocht | Main category emoji |
| Value row | Budget / voorstel welkom / vrijwillig | Price + indicators |
| Accepted icons | When counter-values selected | When barter acceptance set |
| Checkout copy | None | None on tile |

CTAs remain in preview/detail (`Bekijk verzoek` / `Voorstel doen`).

---

## 7. Trust row

Unchanged rules — compact max **2**, standard max **3** signals.

**Forbidden on tiles:** UserStatsTile, HCP, props, views, followers, blended ratings.

---

## 8. Remaining P1/P2 polish

| Item | Priority |
|------|----------|
| Preview accepted-value icons (labels only today) | P2 |
| `barterSlot` reserved hook → optional dedicated barter chip | P2 |
| Server-side tile impression analytics batching | P2 |
| Sponsored tile value-row styling | P3 |

---

## 9. Verification

- [x] Value row from real model data  
- [x] No placeholders when data missing  
- [x] Subcategory-first accepted icons  
- [x] Parent fallback + aria-labels  
- [x] Density caps per variant  
- [x] REQUEST copy / badges  
- [x] Trust compact  
- [x] i18n nl/en  
- [x] Build pass
