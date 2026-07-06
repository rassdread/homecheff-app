# Marketplace Tile Icon Wiring Audit

**Date:** 2026-07-07  
**Phase:** 5B-B  
**Scope:** Tile badge icon wiring + taxonomy normalization — no layout redesign

---

## Executive summary

Phase 5B-B wires **taxonomy Lucide icons** into all marketplace tile badge surfaces via `buildTileBadges` → `TileBadgeRow`. Subcategory icons take priority over main-category fallbacks. Accepted-value badges use registry label + icon. Barter render slot reserved on model; not rendered in UI.

---

## Tile surfaces

| Surface | Component | Badge variant | Icon wiring |
|---------|-----------|---------------|-------------|
| Feed compact | `MarketplaceTileCompact` | `compact` (max 2) | **Ja** — `TileBadgeRow` |
| Feed standard | `MarketplaceTileStandard` | `standard` (max 3) | **Ja** — incl. accepted value |
| Feed mini | `MarketplaceTileMini` | `mini` (max 1) | **Ja** |
| Sidebar | `MarketplaceTileSidebar` | `sidebar` (max 1) | **Ja** — `compact` row |
| Media overlay | `TileMedia` | via parent | **Ja** — delegates to `TileBadgeRow` |

**Niet gewijzigd (bewust):** previews (`MarketplacePreviewShell`), detail badges (`MarketplaceBadgeList`), exchange suggestion cards.

---

## Icon resolution (Opdracht 1)

**Bron:** `lib/marketplace/tiles/resolve-tile-badge-icon.ts`

Prioriteit voor **specialization** (aanbod) badge:

| Prioriteit | Bron | Voorbeeld |
|------------|------|-----------|
| 1 | `model.offerSubCategoryIcon` | `Flame` voor `create.bbq` |
| 2 | Taxonomy registry `icon` | `Flower2` voor `grow.houseplants` |
| 3 | `MAIN_CATEGORY_REGISTRY.lucideIcon` | `UtensilsCrossed` voor HOME_CHEFF |
| 4 | Generic | `Tag` |

**Renderer:** `TileBadgeRow` → `TaxonomyLucideIcon` (Lucide) of emoji span.

**Gevalideerd:**

- BBQ listing → `Flame` + `taxonomyId: create.bbq`
- Kamerplanten accepted → `Flower2` + `grow.houseplants`

`resolveSurfaceIconPlan` (Phase 4A) blijft ongewijzigd — bepaalt **tier policy** voor main-category emoji rij (preview/detail). Tile badges gebruiken **subcategory Lucide** via 5B-B pad; geen conflict met `hideSubcategoriesOnTile` (betrof emoji-overlay, niet badge chips).

---

## Badge normalization (Opdracht 2)

| Badge kind | Label bron | Icoon | Legacy |
|------------|------------|-------|--------|
| `specialization` | `taxonomyLabelKey` via i18n | taxonomy Lucide | Inspiratie: `inspirationCategoryLabel` (legacy) |
| `accepted_value` | registry `labelKey` | taxonomy Lucide | Geen |
| `request` | i18n key | `Hand` Lucide | Geen |
| `workshop_date` | formatted date | `Calendar` | Geen |
| `listing_kind` | i18n kind key | `Tag` | Geen |
| `trust_badge` | discovery trust name | `Award` | Geen |

**Verwijderd:** directe `resolveOfferBadges` label-only mapping zonder icon in tile builder.

**Niet in tile builder:** `legacyCategory` fallback — `resolveTileOfferTaxonomyBadge` gebruikt `legacyCategory: null` en taxonomy-normalize.

---

## Accepted value badges (Opdracht 3)

- **Bron:** `resolveTileAcceptedTaxonomyBadges` → `acceptedValueSubcategories` (fallback: `acceptedSpecializations`)
- **Variant:** alleen `standard` toont `accepted_value` badges (ongewijzigd cap-gedrag)
- **Render:** label + Lucide icon per canonical id
- **Geen** losse tekstlijsten op tile overlay

---

## Exchange / barter readiness (Opdracht 4)

`BuildTileBadgesResult.barterSlot`:

```typescript
{
  reserved: true;
  barterOpenness: string | null;
  hasAcceptedValues: boolean;
}
```

- Gezet wanneer `barterOpenness !== MONEY` of accepted values aanwezig
- **Niet gerenderd** in 5B-B — geen UI-wijziging
- Geen create-flow, matching, of toggle-wijzigingen

---

## Legacy audit (Opdracht 5)

### Via taxonomy registry (tiles)

| Use-case | Taxonomy ID | Tile badge |
|----------|-------------|------------|
| BBQ | `create.bbq` | Flame icon |
| Kamerplanten | `grow.houseplants` | Flower2 icon |
| Oppas (accepted) | `practical.childcare` | Baby icon |
| Fietsreparatie | `practical.bike_repair` | Bike icon |
| Lifestyle-coaching | `knowledge.coaching_lifestyle` | Heart icon |
| Sportcoaching | `knowledge.coaching_sport` | Dumbbell icon |

### Resterende legacy paden (niet tile)

| Pad | Status |
|-----|--------|
| `platform === 'inspiratie'` Compact*Form | Create/edit — buiten 5B-B |
| Inspiratie tiles `inspirationCategoryLabel` | Vrije string label, geen taxonomy id |
| `resolveSurfaceIconPlan` main-category emoji row | Niet op tiles — toekomstig |
| Preview `buildPreviewAcceptedValues` | Labels only — buiten scope |
| Detail `MarketplaceBadgeList` | Al taxonomy icons (pre-5B-B) |

### Geen hardcoded NL strings in tile badge builder

Grep op `build-tile-badges.ts` / `resolve-tile-badge-icon.ts`: geen BBQ, Kamerplanten, Oppas, etc. als literals.

---

## Gewijzigde bestanden

| Bestand | Wijziging |
|---------|-----------|
| `lib/marketplace/tiles/build-tile-badges.ts` | Icons + taxonomy normalization + barterSlot |
| `lib/marketplace/tiles/resolve-tile-badge-icon.ts` | **Nieuw** — icon priority resolver |
| `lib/marketplace/tiles/types.ts` | `TileBadge` icon fields, `BuildTileBadgesResult`, `TileBarterRenderSlot` |
| `components/marketplace/tiles/primitives/TileBadgeRow.tsx` | `TaxonomyLucideIcon` rendering |
| `lib/marketplace/tiles/index.ts` | exports |
| `scripts/validate-marketplace-tile-system.ts` | BBQ + accepted icon assertions |

---

## Validatie

```bash
npx tsx scripts/validate-marketplace-tile-system.ts
# 90+ passed (incl. BBQ Flame, houseplants accepted, barter slot)
npm run lint
npm run build
```

---

## Succescriteria

| Criterium | Status |
|-----------|--------|
| Taxonomy-iconen op tiles | **Ja** |
| Subcategorie-icon voorrang | **Ja** |
| Accepted badges registry + icon | **Ja** (standard variant) |
| Geen layoutwijziging | **Ja** — zelfde overlay positie, +3px icon gap |
| Geen redesign / preview / matching / create-edit | **Ja** |
| Audit opgeleverd | **Ja** |
