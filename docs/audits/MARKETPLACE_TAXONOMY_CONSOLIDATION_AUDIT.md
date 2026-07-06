# Marketplace Taxonomy Consolidation Audit

**Date:** 2026-07-07  
**Phase:** 5B-A  
**Type:** Post-implementation audit  
**Related:** [MARKETPLACE_TAXONOMY_COVERAGE_AUDIT.md](./MARKETPLACE_TAXONOMY_COVERAGE_AUDIT.md)

---

## Executive summary

Phase 5B-A consolidated HomeCheff taxonomy into a **single canonical registry** (`lib/marketplace/taxonomy.ts`) with **96 selecteerbare items**, unified dorpsplein edit/create flows, legacy Dutch string migration, and tile model data readiness.

---

## 1. Toegevoegde categorieën

| Coverage gap (audit) | Taxonomy ID | Status |
|----------------------|-------------|--------|
| Surinaams | `create.cuisine_surinamese` | **Toegevoegd** |
| Indonesisch | `create.cuisine_indonesian` | **Toegevoegd** |
| Antilliaans | `create.cuisine_caribbean` | **Toegevoegd** |
| BBQ | `create.bbq` | **Toegevoegd** |
| Stekjes | `grow.cuttings` | **Toegevoegd** |
| Kamerplanten | `grow.houseplants` | **Toegevoegd** |
| Oppas | `practical.childcare` | **Toegevoegd** |
| Fietsreparatie | `practical.bike_repair` | **Toegevoegd** |
| Lifestyle coaching | `knowledge.coaching_lifestyle` | **Toegevoegd** |
| Sport coaching | `knowledge.coaching_sport` | **Toegevoegd** |

---

## 2. Vervangen legacy categorieën

Legacy Nederlandse strings uit `Compact*Form` worden bij **lezen en edit** gemapt via `lib/marketplace/legacy-subcategory-map.ts`:

| Legacy string | → Taxonomy ID |
|---------------|---------------|
| BBQ | `create.bbq` |
| Bakken | `create.baking` |
| Stekjes | `grow.cuttings` |
| Kamerplanten | `grow.houseplants` |
| Oppas | `practical.childcare` |
| Fietsreparatie | `practical.bike_repair` |
| Surinaams / Wereldkeuken | `create.cuisine_surinamese` |
| … (70+ mappings) | zie `legacy-subcategory-map.ts` |

**Edit flow:** dorpsplein gebruikt niet langer Compact-form dropdown — `TaxonomySpecializationPicker` schrijft canonical ids naar `specializations[]`.

**Nog legacy:** inspiratie-platform (`platform === 'inspiratie'`) en `useMarketplaceV2 === false`.

---

## 3. Aangebrachte mappings

| Systeem | Mapping |
|---------|---------|
| `taxonomy-migrate.ts` | Engelse slugs → dot-ids (+ 10 nieuwe slugs) |
| `legacy-subcategory-map.ts` | Nederlandse UI strings → dot-ids |
| `taxonomy-normalize.ts` | `toCanonicalTaxonomyId` probeert Dutch map vóór slug map |
| `category-taxonomy-map.ts` | `COACHING_TAXONOMY_IDS` + lifestyle/sport |
| `form-config.ts` | Physical CREATE set incl. cuisine + bbq |

---

## 4. Systemen met dezelfde taxonomy

| Systeem | Bron | Selecteerbaar |
|---------|------|---------------|
| Create (dorpsplein V2) | `MarketplaceEntryFlow` → `getEntryFlowItemsForGroup` | 96 |
| Edit (dorpsplein V2) | `TaxonomySpecializationPicker` | 96 |
| Accepted values | `AcceptedValuesPicker` → `getAcceptedValueTaxonomyItems` | 96 |
| Badges (detail) | `resolveOfferBadges` / `resolveAcceptedBadges` | registry ids |
| Exchange matching 4D | `specializationIds` / `acceptedTaxonomyIds` | dot-ids |
| Exchange suggestions 4F/4G | `productRowToExchangeProfile` | dot-ids |
| Tile model (data) | `resolveTileValueExchangeFields` | afgeleid |
| Discovery normalize | `normalizeTaxonomyIds` | dot-ids |

---

## 5. Tile Redesign readiness

### JA (data)

- `MarketplaceTileModel` heeft `offerMainCategory`, `offerSubCategory`, `offerSubCategoryIcon`, `acceptedValueCategories`, `acceptedValueSubcategories`
- Alle 96 items hebben Lucide icon + NL/EN label
- `MAIN_CATEGORY_REGISTRY` + `resolveSurfaceIconPlan` contract bestaat

### NEE (UI — bewust niet in 5B-A)

- Feed tiles tonen nog geen main-category emoji
- `resolveSurfaceIconPlan` niet gekoppeld aan `MarketplaceTileCompact` / `Standard`
- `barterOpenness` niet in create UI
- Inspiratie flows nog Compact-form strings

**Aanbeveling:** Phase 5B tile UI kan starten; P0 voor matching in productie blijft `barterOpenness` UI.

---

## 6. Validatie

```bash
npx tsx scripts/validate-marketplace-taxonomy-consolidation.ts
# 845/845 passed
```

Controleert: registry integrity, parent-child, icon coverage, i18n parity, legacy maps, exchange compatibility, tile fields, flow unification files.

---

## 7. Open items (post 5B-A)

| Item | Prioriteit |
|------|------------|
| Inspiratie → taxonomy picker | P1 |
| `barterOpenness` in `MarketplaceOfferForm` | P0 (exchange) |
| Tile icon UI wiring | Phase 5B |
| Kledingreparatie dedicated item | P2 (nu `practical.repair`) |
| Tuinieren workshop item | P2 |
