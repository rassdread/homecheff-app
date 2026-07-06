# Marketplace Phase 5B-A — Taxonomy Consolidation

**Date:** 2026-07-07  
**Status:** Complete  
**Scope:** Foundation only — no tile redesign, no preview changes, no ranking/search changes

---

## Doel

Eén consistente HomeCheff-taxonomie voor listings, accepted values, exchange matching/suggestions, en toekomstige tile surfaces.

---

## 5B-A.1 — Taxonomy Gap Resolution

**10 nieuwe items** toegevoegd aan `lib/marketplace/taxonomy.ts`:

| ID | Parent group | NL label | Icon |
|----|--------------|----------|------|
| `create.bbq` | `grp.create.meals` | BBQ | Flame |
| `create.cuisine_surinamese` | `grp.create.international` | Surinaams | Globe |
| `create.cuisine_indonesian` | `grp.create.international` | Indonesisch | Globe |
| `create.cuisine_caribbean` | `grp.create.international` | Antilliaans / Caribisch | Sun |
| `grow.cuttings` | `grp.grow.other` | Stekjes | Sprout |
| `grow.houseplants` | `grp.grow.other` | Kamerplanten | Flower2 |
| `practical.childcare` | `grp.practical.all` | Oppas | Baby |
| `practical.bike_repair` | `grp.practical.all` | Fietsreparatie | Bike |
| `knowledge.coaching_lifestyle` | `grp.knowledge.all` | Lifestyle-coaching | Heart |
| `knowledge.coaching_sport` | `grp.knowledge.all` | Sportcoaching | Dumbbell |

**Registry na 5B-A:** 13 groups · 106 items totaal · **96 selecteerbaar** (offer/request/accepted)

**Icon fixes (bestaand):** `create.preserves` → `Package`, `grow.pepper` → `Salad` (ontbrekende Lucide-namen)

**i18n:** `lib/marketplace/taxonomy-labels.data.ts` + sync naar `public/i18n/nl.json` / `en.json` via `validate-marketplace-taxonomy.ts`

---

## 5B-A.2 — Legacy Category Audit

**Centraal mapping-bestand:** `lib/marketplace/legacy-subcategory-map.ts`

Dekking:

- Alle `CompactChefForm` subcategorieën (16 strings)
- Alle `CompactGardenForm` subcategorieën (16 strings)
- Alle `CompactDesignerForm` subcategorieën (16 strings)
- Veelvoorkomende dienst/coaching free-text labels

**Nog legacy (bewust):**

- `platform === 'inspiratie'` → Compact*Form (inspiratie-flow buiten dorpsplein V2)
- `useMarketplaceV2 === false` → Compact*Form fallback

---

## 5B-A.3 — Taxonomy Unification

| Flow | Voor | Na |
|------|------|-----|
| Dorpsplein create | `MarketplaceEntryFlow` | Ongewijzigd |
| Dorpsplein edit | `Compact*Form` + NL dropdown | `MarketplaceOfferForm` + `TaxonomySpecializationPicker` |
| Accepted values | `AcceptedValuesPicker` | Ongewijzigd (zelfde 96 items) |
| Normalisatie | Alleen slug-map | + Dutch legacy map in `toCanonicalTaxonomyId` |

**Gewijzigde bestanden:**

- `components/products/CategoryFormSelector.tsx` — edit routed naar V2 form
- `components/products/marketplace/TaxonomySpecializationPicker.tsx` — **nieuw**
- `components/products/marketplace/MarketplaceOfferForm.tsx` — edit picker + volledige product load
- `app/product/[id]/edit/page.tsx` — V2 velden doorgeven

---

## 5B-A.4 — Accepted Values Alignment

- `AcceptedValuesPicker` gebruikt `getAcceptedValueTaxonomyItems()` — nu **96 items** incl. nieuwe cuisine/dienst/coaching ids
- `normalizeAcceptedTaxonomyIds` — alleen `allowedAsAcceptedValue` items
- Exchange profiles: `acceptedTaxonomyIds` = canonical dot-ids (gevalideerd in consolidation script)

Voorbeeld uit validatie:

```
Aanbod: artistic.portrait
Geaccepteerd: create.cuisine_surinamese  ✓ taxonomy id op profile
```

---

## 5B-A.5 — Matching Readiness

- `COACHING_TAXONOMY_IDS` uitgebreid met `knowledge.coaching_lifestyle`, `knowledge.coaching_sport`
- Exchange 4D/4F/4G gebruikt generieke taxonomy-id overlap — nieuwe items automatisch meegenomen
- Geen resolver-wijzigingen nodig (geen regressies in `validate-exchange-suggestions.ts`)

---

## 5B-A.6 — Tile Readiness Preparation

**Nieuw:** `lib/marketplace/tiles/resolve-tile-value-exchange.ts`

Velden op `MarketplaceTileModel` (data only, geen UI):

- `offerMainCategory`
- `offerSubCategory`
- `offerSubCategoryIcon`
- `acceptedValueCategories`
- `acceptedValueSubcategories`

Gevuld in:

- `mapGeoFeedCardToTileModel`
- `mapProfileListingToTileModel`

---

## 5B-A.7 — Icon Readiness

- Alle 96 selecteerbare items hebben geldige Lucide `icon` (gevalideerd in consolidation script)
- `MAIN_CATEGORY_REGISTRY` ongewijzigd (8 hoofdcategorieën)
- `resolveSurfaceIconPlan` / `TILE_ICON_DISPLAY_RULES` ongewijzigd — nog niet wired naar live tiles

---

## 5B-A.8 — i18n

- NL + EN labels voor alle 96 items via `taxonomy-labels.data.ts`
- `searchTerms` op elk nieuw item in registry

---

## Validatie

```bash
npx tsx scripts/validate-marketplace-taxonomy.ts
npx tsx scripts/validate-marketplace-taxonomy-consolidation.ts
```

Consolidation script: **845/845** checks

---

## Tile Redesign — veilig nu?

| Aspect | Status |
|--------|--------|
| Taxonomy-dekking coverage gaps | **Grotendeels opgelost** (10 P0-items) |
| Eén taxonomy-bron create/edit dorpsplein | **Ja** |
| Accepted values = zelfde ids | **Ja** |
| Tile model velden | **Ja** (data op model) |
| Tile UI iconen | **Nee** — nog geen `resolveSurfaceIconPlan` wiring (Phase 5B) |
| `barterOpenness` create UI | **Nee** — nog open (Value Exchange Audit P0) |
| Inspiratie Compact-forms | **Nee** — nog legacy strings |

**Conclusie:** Tile Redesign **data-fundering** is klaar; **UI-redesign (5B)** kan starten zodra `barterOpenness` UI en tile-icon wiring gepland zijn.

---

## Related docs

- [MARKETPLACE_TAXONOMY_COVERAGE_AUDIT.md](../audits/MARKETPLACE_TAXONOMY_COVERAGE_AUDIT.md)
- [MARKETPLACE_TAXONOMY_CONSOLIDATION_AUDIT.md](../audits/MARKETPLACE_TAXONOMY_CONSOLIDATION_AUDIT.md)
- [MARKETPLACE_VALUE_EXCHANGE_DATA_AUDIT.md](../audits/MARKETPLACE_VALUE_EXCHANGE_DATA_AUDIT.md)
