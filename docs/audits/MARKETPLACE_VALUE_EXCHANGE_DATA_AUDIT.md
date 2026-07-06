# Marketplace Value Exchange Data Audit

**Date:** 2026-07-06  
**Purpose:** Establish what value-exchange data exists today before Marketplace Tile Refresh Phase 5B  
**Scope:** Read-only analysis — no code changes  
**Status:** Complete

---

## Executive summary

HomeCheff has **two parallel classification systems** on `Product`: legacy (`category` + Dutch `subcategory` strings) and V2 (`marketplaceCategory` + taxonomy dot-ids in `specializations[]` / `acceptedSpecializations[]`).

**V2 create flow** lets users pick main category → group → **specific taxonomy subcategory items** (e.g. `grow.basil`, `artistic.portrait`). **Accepted counter-value** is stored as **subcategory taxonomy IDs** (multi-select), not main-category-only.

**Critical gaps for Tile Redesign:**

1. **`barterOpenness` is not set by the create UI** — defaults to `null` → treated as `MONEY` → exchange matching **ignores** `acceptedSpecializations` for barter overlap.
2. **`mainCategory` is never stored** — always derived at read time from `marketplaceCategory` + first specialization.
3. **No per-accepted-value wish/description field** on `Product` — only listing-level `description` and REQUEST `title` reused as desired-exchange text.
4. **`resolveSurfaceIconPlan` (Phase 4A) is not wired** to live tiles — tiles use taxonomy badge labels, not main-category emoji icons.
5. **`buildDetailValueExchangeBlock` exists but is not rendered** on the product detail page.

---

## Architecture overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CREATE / EDIT UI                          │
├──────────────────────────┬──────────────────────────────────────┤
│ V2 dorpsplein (new)      │ Legacy compact forms (edit/inspiratie)│
│ MarketplaceEntryFlow     │ CompactChef/Garden/DesignerForm       │
│ → main + group + items   │ → Dutch subcategory dropdown          │
│ MarketplaceOfferForm     │                                       │
│ → AcceptedValuesPicker   │                                       │
└────────────┬─────────────┴──────────────────┬───────────────────┘
             │ POST/PATCH                      │
             ▼                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ parseMarketplaceV2FromBody()  →  prisma.product                  │
│   marketplaceCategory, specializations[], acceptedSpecializations[]│
│   barterOpenness (API-only; UI omits)                           │
└────────────┬────────────────────────────────────────────────────┘
             │
    ┌────────┴────────┬────────────────────┬─────────────────────┐
    ▼                 ▼                    ▼                     ▼
 Tile model      Preview builder    Exchange profile      Detail badges
 (taxonomy ids)  (taxonomy labels)  (4D matching)         (offered/accepted)
```

**Key lib modules**

| Module | Path |
|--------|------|
| Taxonomy registry | `lib/marketplace/taxonomy.ts` |
| Taxonomy resolve | `lib/marketplace/taxonomy-resolve.ts` |
| Value-exchange contracts | `lib/marketplace/value-exchange/value-exchange-contract.ts` |
| Main-category mapping | `lib/marketplace/value-exchange/main-categories.ts` |
| Category → main map | `lib/marketplace/value-exchange/category-taxonomy-map.ts` |
| Exchange profile build | `lib/marketplace/exchange/exchange-resolver.ts` |
| Exchange overlap/score | `lib/marketplace/exchange/exchange-overlap.ts` |
| Tile model | `lib/marketplace/tiles/types.ts`, `map-to-tile-model.ts` |
| Tile display rules (unwired) | `lib/marketplace/value-exchange/tile-display-rules.ts` |
| Detail value block (unwired) | `lib/marketplace/detail/detail-value-exchange-block.ts` |

---

## Onderzoeksvraag 1 — Listing categorieën

### Welke hoofdcategorieën bestaan?

**Prisma `MarketplaceCategory` (6 values)** — stored on `Product.marketplaceCategory`:

| Enum | UI label (i18n) |
|------|-----------------|
| `CREATE` | HomeCheff / maken |
| `GROW` | HomeGarden |
| `DESIGN` | HomeDesigner (design) |
| `ARTISTIC_SERVICE` | HomeDesigner (artistiek) |
| `PRACTICAL_SERVICE` | Diensten |
| `KNOWLEDGE` | Workshops / coaching |

**Value-exchange icon taxonomy (8 user-facing)** — `VALUE_EXCHANGE_MAIN_CATEGORIES` in `value-exchange-contract.ts`:

`HOME_CHEFF`, `HOME_GARDEN`, `HOME_DESIGNER`, `SERVICES`, `WORKSHOPS`, `COACHING`, `DELIVERY`, `REQUESTS`

Mapped via `MAIN_CATEGORY_REGISTRY` (`main-categories.ts`) and `marketplaceCategoryToMainCategory()` (`category-taxonomy-map.ts`).

**Legacy `ProductCategory` enum** (still required on every row): `CHEFF`, `GROWN`, `DESIGNER`.

### Welke subcategorieën bestaan?

Canonical subcategories are **taxonomy item dot-ids** in `MARKETPLACE_TAXONOMY` (`lib/marketplace/taxonomy.ts`):

- **Groups** — e.g. `grp.create.meals`, `grp.grow.herbs`, `grp.artistic`
- **Items** — e.g. `create.meal`, `grow.basil`, `artistic.portrait`, `knowledge.cookingclass`

Each item has: `id`, `category` (Prisma enum), `parentId`, `icon` (Lucide name), `labelKey`, `searchTerms`, flags (`allowedAsOffer`, `allowedAsRequest`, `allowedAsAcceptedValue`, `futureOnly`, `blocked`).

### Waar opgeslagen?

```397:434:prisma/schema.prisma
model Product {
  category          ProductCategory
  subcategory       String?
  listingIntent         ListingIntent          @default(OFFER)
  marketplaceCategory   MarketplaceCategory?
  specializations        String[]               @default([])
  acceptedSpecializations String[]              @default([])
  barterOpenness         BarterOpenness?
  // ...
}
```

| Field | Content | Required? |
|-------|---------|-----------|
| `marketplaceCategory` | Prisma enum (6) | Optional in DB; parser defaults to `CREATE` |
| `specializations` | Taxonomy dot-ids (`grow.basil`) | Optional in API; **required in V2 entry UI** |
| `subcategory` | First specialization or legacy Dutch string | Optional |
| `category` | Legacy `CHEFF`/`GROWN`/`DESIGNER` | **Required** |
| `listingIntent` | `OFFER` \| `REQUEST` | Required, default `OFFER` |

### Create flow — wat kan de gebruiker kiezen?

**V2 new listing** (`MarketplaceEntryFlow` → `MarketplaceOfferForm`):

1. Intent: OFFER or REQUEST
2. Main category: one of 6 `MarketplaceCategory`
3. Group: taxonomy group within category
4. Items: **multi-select taxonomy chips** (≥1 enforced in UI)

```109:116:components/products/marketplace/MarketplaceEntryFlow.tsx
  const goToSummary = () => {
    if (selectedSpecs.length === 0) {
      setMessage(t(MARKETPLACE_ERROR_KEYS.specializationsRequired));
      return;
    }
```

**Edit flow** uses legacy compact forms — Dutch dropdown strings, **not** taxonomy ids. V2 fields cannot be changed through standard edit UI (`CategoryFormSelector` routes edit to legacy forms).

### Voorbeeld payload (V2 offer)

```json
{
  "listingIntent": "OFFER",
  "marketplaceCategory": "GROW",
  "specializations": ["grow.tomato", "grow.basil"],
  "acceptedSpecializations": ["create.meal", "artistic.portrait"],
  "subcategory": "grow.tomato",
  "barterOpenness": null
}
```

**DB result:**

```json
{
  "category": "GROWN",
  "marketplaceCategory": "GROW",
  "listingIntent": "OFFER",
  "subcategory": "grow.tomato",
  "specializations": ["grow.tomato", "grow.basil"],
  "acceptedSpecializations": ["create.meal", "artistic.portrait"],
  "barterOpenness": null
}
```

---

## Onderzoeksvraag 2 — Geaccepteerde tegenwaarde

### Kan een gebruiker aangeven wat hij accepteert als tegenprestatie?

**JA — in V2 create UI**, via `AcceptedValuesPicker` on `MarketplaceOfferForm`.

```516:517:components/products/marketplace/MarketplaceOfferForm.tsx
        value={acceptedSpecializations}
```

The picker loads **all taxonomy items** with `allowedAsAcceptedValue: true`, grouped by category and group. Users multi-select **specific subcategory items** (not main-category-only chips).

```32:32:components/products/marketplace/AcceptedValuesPicker.tsx
  const allItems = useMemo(() => getAcceptedValueTaxonomyItems(), []);
```

### Hoofdcategorieën vs subcategorieën

| Level | Used for accepted value? | Storage |
|-------|--------------------------|---------|
| Main category | Filter UI only (`categoryFilter` buttons) | **Not stored** — derived from taxonomy ids |
| Subcategory (taxonomy item) | **Yes — this is what is stored** | `acceptedSpecializations[]` |

Main categories for accepted values are **derived at read time**:

```24:28:lib/marketplace/value-exchange/barter-models.ts
  return {
    acceptedMainCategories: acceptedMainCategoriesFromTaxonomyIds(
      input.acceptedTaxonomyIds,
    ),
    acceptedTaxonomyIds: input.acceptedTaxonomyIds,
```

### Meerdere categorieën?

**JA** — `acceptedSpecializations` is `String[]`; picker supports unlimited multi-select (UI shows all selected chips).

### Velden

| Field | Role |
|-------|------|
| `acceptedSpecializations` | Canonical storage — taxonomy dot-ids |
| `barterOpenness` | `MONEY` \| `MONEY_AND_BARTER` \| `BARTER_ONLY` — **gates whether acceptance is active in exchange** |
| `priceModel` + `priceCents` | Influences payment display, not acceptance storage |

### `barterOpenness` gap

`MarketplaceOfferForm` submit payload **does not include `barterOpenness`**:

```291:318:components/products/marketplace/MarketplaceOfferForm.tsx
    const payload = {
      title: title.trim(),
      description: description.trim(),
      // ...
      acceptedSpecializations,
      // barterOpenness: NOT PRESENT
```

Parser accepts it from API body but UI never sends it → **always `null` on new V2 creates**.

Exchange acceptance model returns `null` when openness is `MONEY`:

```108:109:lib/marketplace/exchange/exchange-resolver.ts
  const openness = String(input.barterOpenness ?? 'MONEY').toUpperCase() as BarterOpenness;
  if (openness === 'MONEY') return null;
```

**Implication:** `acceptedSpecializations` are **stored and displayed** on detail/tiles, but **4D matching treats acceptance as inactive** unless `barterOpenness` is set to `MONEY_AND_BARTER` or `BARTER_ONLY` (API/manual only today).

---

## Onderzoeksvraag 3 — Subcategorie ondersteuning

### 🍳 HomeCheff → Surinaamse maaltijd

**NEE** (als specifieke taxonomy-subcategorie)

- Geen taxonomy-item `surinaam`, `roti`, of vergelijkbaar in `lib/marketplace/taxonomy.ts`.
- Closest canonical items: `create.meal` (generic “maaltijd”), or international group items (`create.spices`, `create.sauces`, etc.).
- Legacy create kan `"Surinaamse maaltijd"` als vrije `subcategory` string opslaan — **zonder taxonomy dot-id**, niet bruikbaar voor 4D matching.

```152:152:lib/marketplace/taxonomy.ts
  item('create.meal', 'CREATE', { icon: 'UtensilsCrossed', tone: 'food', parentId: G_MEALS, searchTerms: ['meals', 'maaltijden', 'food', 'eten'] }),
```

### 🌱 HomeGarden → Basilicum

**JA**

```198:198:lib/marketplace/taxonomy.ts
  item('grow.basil', 'GROW', { icon: 'Leaf', tone: 'garden', parentId: G_HERBS, searchTerms: ['basilicum', 'basil'] }),
```

Stored in `specializations[]` via `MarketplaceEntryFlow` item step. Example DB: `"specializations": ["grow.basil"]`.

### 🎨 HomeDesigner → Portret

**JA** (via `ARTISTIC_SERVICE` → `HOME_DESIGNER` main category)

```227:227:lib/marketplace/taxonomy.ts
  item('artistic.portrait', 'ARTISTIC_SERVICE', { icon: 'User', tone: 'artistic', parentId: G_ARTISTIC, searchTerms: ['portret', 'portrait'] }),
```

`marketplaceCategoryToMainCategory('ARTISTIC_SERVICE', …)` → `HOME_DESIGNER`.

### Samenvatting Q3

| Voorbeeld | Opslaan als subcategorie? | Taxonomy-id | Matching-ready? |
|-----------|---------------------------|-------------|-----------------|
| Surinaamse maaltijd | Alleen generiek of legacy tekst | Geen specifieke id | NEE voor specifiek |
| Basilicum | JA | `grow.basil` | JA |
| Portret | JA | `artistic.portrait` | JA |

**V2 flow supports main → subcategory for all taxonomy items.** Legacy/edit flow may store human-readable strings without dot-ids.

---

## Onderzoeksvraag 4 — Optionele wensomschrijving

### Status: **Bestaat gedeeltelijk**

| Mechanism | Exists? | Details |
|-----------|---------|---------|
| Listing `description` | **JA** | General free text on `Product.description` — create/edit UI |
| Per-accepted-value wish text | **NEE** | No DB column; `acceptedSpecializations` is id-only array |
| `DesiredExchangeDetail.description` | **Gedeeltelijk** | Contract field exists; **not persisted** on Product |
| REQUEST wish description | **Gedeeltelijk** | Built from **listing title**, not separate wish field |

```33:51:lib/marketplace/value-exchange/barter-models.ts
export function buildDesiredExchangeDetail(input: {
  mainCategory: ValueExchangeMainCategory;
  subcategoryId: string;
  description: string;
}): DesiredExchangeDetail | null {
  // ...
  return {
    mainCategory: input.mainCategory ?? resolvedMain,
    subcategoryId: input.subcategoryId,
    subcategoryLabelKey: item.labelKey,
    description: input.description.trim(),
  };
}
```

Production mapper sets `description: row.title` for REQUEST listings:

```57:61:lib/marketplace/exchange-suggestions/exchange-suggestion-profile-mapper.ts
            return buildDesiredExchangeDetail({
              mainCategory,
              subcategoryId,
              description: row.title,
            });
```

**Grep for dedicated fields** (`wishDescription`, `barterNote`, `exchangeNote`, `preferenceDescription`, `acceptedDescription`): **no matches** in codebase.

**Proposal model** (`Proposal.description`, `acceptedValueTaxonomyIds`) supports value exchange in chat/proposals — **separate from listing create**, not used for tile/preview data.

### Voorbeelden uit de vraag

| Wish text | Supported today? |
|-----------|------------------|
| "Ik zou graag weer een authentieke roti willen eten." | Only as general listing `description` or REQUEST `title` — not as structured accepted-value wish |
| "Een goede basilicum heb ik wel oor naar." | Only as listing `description` |
| "Liefst een realistisch portret." | Only as listing `description` |

---

## Onderzoeksvraag 5 — Matching gebruik

### Exchange Matching (4D)

| Data | Status | Evidence |
|------|--------|----------|
| **Hoofdcategorie** | **Gebruikt** | `offer.mainCategory`, `acceptance.mainCategories`, `desiredExchanges[].mainCategory` in `exchange-overlap.ts` |
| **Subcategorie** | **Gebruikt** | `offer.subcategoryIds`, `acceptance.subcategoryIds`, `desiredExchanges[].subcategoryId` — overlap, scoring, match types |
| **Beschrijvende wensen** | **Niet gebruikt** | `DesiredExchangeDetail.description` never read in `lib/marketplace/exchange/` |

Overlap example — subcategory intersection:

```42:50:lib/marketplace/exchange/exchange-overlap.ts
function directOfferWants(
  offerer: ExchangeListingProfile,
  wanter: ExchangeListingProfile,
): Array<{ subcategoryId: string }> {
  const offerIds = offerSubcategories(offerer);
  const wantIds = desiredSubcategories(wanter);
  return intersect(offerIds, wantIds).map((subcategoryId) => ({ subcategoryId }));
}
```

**Caveat:** `acceptance` is `null` when `barterOpenness` is `MONEY`/null — accepted subcategories **not used in matching** for typical V2 listings.

### Exchange Suggestions (4F/4G)

| Data | Status | Evidence |
|------|--------|----------|
| **Hoofdcategorie** | **Gedeeltelijk** | Used in matching via 4D; `mainCategory` on suggestion **cards** is display-only (`counterparty.offer.mainCategory`) |
| **Subcategorie** | **Gebruikt** | Via 4D overlap in `resolve-exchange-suggestions.ts` |
| **Beschrijvende wensen** | **Niet gebruikt** | No reference to `description` in resolver or caps |

---

## Onderzoeksvraag 6 — Tile Redesign Readiness

### Proposed 5B layout vs current data

| UI element | Data needed | Available today? | Notes |
|------------|-------------|------------------|-------|
| **Offer main-category icon on image** | `offerMainCategory` | **Gedeeltelijk** | `marketplaceCategory` + `specializations[0]` on tile; must derive via `marketplaceCategoryToMainCategory()`. Not on `MarketplaceTileModel`. `resolveSurfaceIconPlan` exists but **unwired**. |
| **Payment methods under price** | `barterOpenness`, `priceModel` | **Gedeeltelijk** | `buildTilePriceLine` uses `barterOpenness` for barter labels; most listings have `null`. Payment method registry exists in value-exchange lib. |
| **"Ruilen mogelijk" indicator** | `barterOpenness` ≠ `MONEY` | **NEE** (meeste listings) | UI stores accepted values but not openness flag. |
| **Accepted category icons below price** | `acceptedSpecializations` → main categories | **Gedeeltelijk** | Tile has taxonomy ids; badges show **subcategory labels** (`resolveAcceptedBadges`), not main-category emojis. Standard tile shows max 1 accepted badge. |
| **Preview: accepted main category** | Derived main categories | **NEE** (as icons) | Preview uses taxonomy label chips (`build-preview-accepted.ts`), not `MAIN_CATEGORY_REGISTRY` emojis. |
| **Preview: accepted subcategory** | `acceptedSpecializations` | **JA** | Up to 6 taxonomy labels in preview. |
| **Preview: optional wish description** | Per-value or desired-exchange description | **NEE** | No structured wish; REQUEST uses listing `description` as `requestSummary`. |
| **Detail: full value exchange config** | All fields + `buildDetailValueExchangeBlock` | **Gedeeltelijk** | Detail shows `ProductOfferedBadgesSection` + `ProductAcceptedBadgesSection` (taxonomy badges). Unified value-exchange block **not rendered**. `barterOpenness` usually missing. |

### Antwoord: **NEE** — niet veilig om blind op volledige 5B-layout te bouwen

### Ontbrekende / inconsistente datavelden voor 5B

| Priority | Gap | Impact |
|----------|-----|--------|
| **P0** | `barterOpenness` not set in create UI | "Ruilen mogelijk" and exchange acceptance inactive in matching |
| **P0** | `offerMainCategory` not on tile model | Must add derivation or mapper field for category icon on image |
| **P1** | `resolveSurfaceIconPlan` not wired to tiles | Display rules exist but tiles use different badge system |
| **P1** | Accepted values shown as subcategory labels, not main-category icons | 5B spec wants emoji icons — needs mapper from `acceptedSpecializations` → unique main categories |
| **P2** | No per-accepted-value wish/description | Preview "wensomschrijving" not available |
| **P2** | REQUEST desired-exchange description = title only | No dedicated wish field |
| **P2** | Legacy listings without taxonomy dot-ids | Fallback strategy needed for edit/legacy data |
| **P3** | `buildDetailValueExchangeBlock` not on product page | Detail "full config" partially duplicated by badge sections |

---

## Datamodel-overzicht

### Product (listing) — value-exchange relevant fields

```
Product
├── marketplaceCategory    MarketplaceCategory?     # 6 Prisma enums
├── specializations        String[]                 # Offer/request taxonomy ids
├── acceptedSpecializations String[]                # Accepted counter-value taxonomy ids
├── barterOpenness         BarterOpenness?          # MONEY | MONEY_AND_BARTER | BARTER_ONLY
├── listingIntent          OFFER | REQUEST
├── priceModel             PriceModel
├── priceCents             Int
├── description            String?                  # General listing text
├── subcategory            String?                  # Legacy or first specialization
└── category               CHEFF | GROWN | DESIGNER # Legacy required
```

### Derived (not stored)

```
ExchangeListingProfile
├── offer.mainCategory          ← marketplaceCategoryToMainCategory(...)
├── offer.subcategoryIds        ← specializations[]
├── acceptance.mainCategories   ← from acceptedSpecializations[] (if barterOpenness ≠ MONEY)
├── acceptance.subcategoryIds   ← acceptedSpecializations[]
└── desiredExchanges[]          ← REQUEST only; built from specializations[] + title
```

### Tile model (`MarketplaceTileModel`) — today

```
├── marketplaceCategory: string | null
├── specializations: string[]
├── acceptedSpecializations: string[]
├── barterOpenness: string | null
├── listingIntent: OFFER | REQUEST | null
├── description: string | null
└── (no mainCategory, no desiredExchanges, no paymentMethod enum)
```

---

## Bestaande beperkingen

1. **Dual taxonomy** — legacy Dutch strings vs canonical dot-ids in same columns.
2. **Edit bypasses V2** — cannot update specializations/accepted values through standard edit UI.
3. **Accepted values stored but barter inactive** — `barterOpenness` null → matching ignores acceptance.
4. **No wish text per accepted value** — only listing-level description.
5. **REQUEST "want" = title** — not a separate structured wish.
6. **Display layer split** — tiles use `buildTileBadges`; value-exchange uses `resolveSurfaceIconPlan` (unwired).
7. **Detail value-exchange block unwired** — `buildDetailValueExchangeBlock` only in validation scripts.
8. **Taxonomy gaps** — no item for cuisine-specific subtypes (e.g. Surinaamse maaltijd); generic `create.meal` only.

---

## Aanbeveling voor Phase 5B

### Can build now (data exists)

- Subcategory taxonomy labels on tiles/previews (`specializations`, `acceptedSpecializations`)
- Offer subcategory badge (first specialization) — already in `buildTileBadges`
- Accepted value badges on standard tiles (one subcategory label)
- Price line from `priceModel` / `priceCents`
- Detail offered + accepted badge sections (current product page)

### Requires mapper / derivation work (no schema change)

- **Offer main-category emoji** on tile image — derive from `marketplaceCategory` + `specializations[0]`
- **Accepted main-category icons** — `mainCategoriesFromTaxonomyIds(acceptedSpecializations)` capped at 3
- Wire `resolveSurfaceIconPlan` or equivalent into tile badge strip

### Requires product/schema or UI work first

- **`barterOpenness` in create/edit UI** — without this, "ruilen mogelijk" is misleading for most listings
- **Per-accepted-value description** — new field(s) if preview wish text is required
- **REQUEST wish field** — separate from title if structured desired-exchange descriptions are needed
- **Taxonomy expansion** — if cuisine-specific subcategories (Surinaams, roti) are product requirements

### Suggested 5B phasing

| Phase | Scope |
|-------|-------|
| **5B-1** | Tile mapper: add `offerMainCategory`, `acceptedMainCategories[]`; derive icons from `MAIN_CATEGORY_REGISTRY` |
| **5B-2** | Price/barter line: surface `barterOpenness` in create UI OR infer openness when `acceptedSpecializations.length > 0` |
| **5B-3** | Preview: main-category icons + subcategory labels (data exists); defer wish text |
| **5B-4** | Detail: wire `buildDetailValueExchangeBlock` or consolidate badge sections |
| **5B-5** | Wish descriptions (schema + UI) — only if product requires |

---

## Category Icon & Visual Metadata Audit

**Scope:** Questions 7–10 — visual identity of main categories and subcategories  
**Method:** Read-only inventory of registries, types, and UI wiring

### Onderzoeksvraag 7 — Category Registry

#### Hoofdcategorieën met icoon (centraal beheerd)

Alle 8 value-exchange hoofdcategorieën hebben **emoji + Lucide-naam** in één registry:

| ID | Emoji | Lucide | Bestand |
|----|-------|--------|---------|
| `HOME_CHEFF` | 🍳 | `UtensilsCrossed` | `main-categories.ts` |
| `HOME_GARDEN` | 🌱 | `Sprout` | idem |
| `HOME_DESIGNER` | 🎨 | `Palette` | idem |
| `SERVICES` | 🔧 | `Wrench` | idem |
| `WORKSHOPS` | 📚 | `GraduationCap` | idem |
| `COACHING` | 🎓 | `HeartHandshake` | idem |
| `DELIVERY` | 🚚 | `Truck` | idem |
| `REQUESTS` | 🙋 | `Hand` | idem |

```15:22:lib/marketplace/value-exchange/main-categories.ts
  HOME_CHEFF: {
    id: 'HOME_CHEFF',
    emoji: '🍳',
    labelKey: `${KEY}.homeCheff`,
    icon: '🍳',
    lucideIcon: 'UtensilsCrossed',
    marketplaceCategories: ['CREATE'],
```

**Centraal beheerd: JA.** Primaire bronnen:

| Registry | Pad | Inhoud |
|----------|-----|--------|
| Main category (emoji + Lucide) | `lib/marketplace/value-exchange/main-categories.ts` | 8 icon-hoofdcategorieën |
| Main category contract | `lib/marketplace/value-exchange/value-exchange-contract.ts` | `MainCategoryContract` type |
| Emoji helper (exchange UI) | `lib/marketplace/exchange-suggestions/exchange-suggestion-category-icon.ts` | `mainCategoryEmoji()` |
| Prisma category meta (Lucide fallback) | `lib/marketplace/taxonomy-badges.ts` | `MARKETPLACE_CATEGORY_META` (6 enums) |
| Legacy vertical meta | `lib/marketplace/taxonomy-badges.ts` | `LEGACY_CATEGORY_META` (CHEFF/GROWN/DESIGNER) |
| Payment method icons | `lib/marketplace/value-exchange/payment-methods.ts` | `PAYMENT_METHOD_REGISTRY` (emoji) |
| Display rules (tier policy) | `lib/marketplace/value-exchange/tile-display-rules.ts` | max icons per surface |

**Twee parallelle systemen:**

1. **Value-exchange main categories** (8) — emoji voor barter/tile redesign / exchange suggestions  
2. **Prisma `MarketplaceCategory`** (6) — Lucide in `MARKETPLACE_CATEGORY_META` voor badges/fallback

Mapping tussen beide: `lib/marketplace/value-exchange/category-taxonomy-map.ts` → `marketplaceCategoryToMainCategory()`.

#### Waar main-category emoji's al live zijn

- Exchange suggestion surfaces (4G): `mainCategoryEmoji()` op cards, feed inserts, sidebar, mobile
- **Niet** op feed tiles, previews, of detail badge-secties (die gebruiken taxonomy Lucide of tekst)

---

### Onderzoeksvraag 8 — Subcategorie Icon Support

#### Registry-overzicht

**Centrale bron:** `lib/marketplace/taxonomy.ts` → `MARKETPLACE_TAXONOMY`

- **13 groups** — elk met eigen Lucide `icon` (bijv. `grp.create.meals` → `UtensilsCrossed`)
- **~89 taxonomy items** — elk met verplicht `icon: string` (Lucide component name)
- **8 blocked items** — ook met `icon` (default `Ban`)

Type-definitie:

```32:55:lib/marketplace/taxonomy-types.ts
export type MarketplaceTaxonomyItem = {
  id: string;
  category: MarketplaceTaxonomyCategory;
  parentId?: string;
  level: TaxonomyLevel;
  labelKey: string;
  shortLabelKey?: string;
  /** Lucide-compatible icon name (resolved in UI layer later) */
  icon: string;
  tone: TaxonomyTone;
  searchTerms?: string[];
  // ...
};
```

**Geen aparte emoji per subcategorie** — alleen Lucide-naam + `tone` voor kleur.

#### Per hoofdcategorie — gevraagde voorbeelden

##### HomeCheff (`CREATE`)

| Voorbeeld | Taxonomy-item | Eigen icoon | Opmerking |
|-----------|---------------|-------------|-----------|
| Surinaams | — | **Nee** | Geen item in registry |
| Indonesisch | — | **Nee** | Geen item in registry |
| BBQ | — | **Nee** | Geen item; geen searchTerm match |
| Taarten | `create.cake` | **Ja** | `CakeSlice`, tone `food` |

```155:155:lib/marketplace/taxonomy.ts
  item('create.cake', 'CREATE', { icon: 'CakeSlice', tone: 'food', parentId: G_MEALS, searchTerms: ['taart', 'cake'] }),
```

Dichtstbijzijnde alternatieven: `create.meal` (`UtensilsCrossed`), `create.catering` (`ChefHat`), `create.spices` (`Flame`).

##### HomeGarden (`GROW`)

| Voorbeeld | Taxonomy-item | Eigen icoon | Opmerking |
|-----------|---------------|-------------|-----------|
| Kruiden | `grow.herbs` | **Ja** | `Leaf` |
| Groenten | `grow.vegetables` | **Ja** | `Carrot` |
| Fruit | `grow.fruit` | **Ja** | `Apple` |
| Kamerplanten | `grow.plants` | **Gedeeltelijk** | `Flower2` — algemeen "planten", niet specifiek kamerplant |

```197:204:lib/marketplace/taxonomy.ts
  item('grow.herbs', 'GROW', { icon: 'Leaf', tone: 'garden', parentId: G_HERBS, searchTerms: ['kruiden', 'herbs'] }),
  // ...
  item('grow.plants', 'GROW', { icon: 'Flower2', tone: 'garden', parentId: G_GROW_OTHER, searchTerms: ['planten', 'plants'] }),
```

Ook per-item icons: `grow.basil` (`Leaf`), `grow.tomato` (`Cherry`), etc.

##### HomeDesigner (`DESIGN` + `ARTISTIC_SERVICE`)

| Voorbeeld | Taxonomy-item | Eigen icoon | Opmerking |
|-----------|---------------|-------------|-----------|
| Portret | `artistic.portrait` | **Ja** | `User` |
| Schilderij | `artistic.painting` | **Ja** | `Palette` |
| Logo | `design.logo` | **Ja** | `PenTool` |
| Kledingreparatie | — | **Nee** | Geen specifiek item; `practical.repair` is generiek |

```207:227:lib/marketplace/taxonomy.ts
  item('design.logo', 'DESIGN', { icon: 'PenTool', tone: 'creative', parentId: G_DESIGN_BRAND, searchTerms: ['logo'] }),
  // ...
  item('artistic.painting', 'ARTISTIC_SERVICE', { icon: 'Palette', tone: 'artistic', parentId: G_ARTISTIC, searchTerms: ['schilderen', 'painting'] }),
  item('artistic.portrait', 'ARTISTIC_SERVICE', { icon: 'User', tone: 'artistic', parentId: G_ARTISTIC, searchTerms: ['portret', 'portrait'] }),
```

`create.clothing` (`Shirt`) = kleding **product**, geen reparatiedienst.

##### Diensten (`PRACTICAL_SERVICE`)

| Voorbeeld | Taxonomy-item | Eigen icoon | Opmerking |
|-----------|---------------|-------------|-----------|
| Fietsreparatie | — | **Nee** | `practical.repair` is generiek `Wrench` |
| Oppas | — | **Nee** | Geen taxonomy-item |
| Schoonmaak | `practical.cleaning` | **Ja** | `Sparkles` |

```232:236:lib/marketplace/taxonomy.ts
  item('practical.cleaning', 'PRACTICAL_SERVICE', { icon: 'Sparkles', tone: 'service', parentId: G_PRACTICAL, searchTerms: ['schoonmaak', 'cleaning'] }),
  item('practical.repair', 'PRACTICAL_SERVICE', { icon: 'Wrench', tone: 'service', parentId: G_PRACTICAL, searchTerms: ['reparatie', 'repair'] }),
```

#### Samenvatting Q8

| Status | Aantal (gevraagde voorbeelden) |
|--------|-------------------------------|
| Eigen icoon aanwezig | 10 / 15 |
| Geen eigen icoon / geen item | 5 / 15 (Surinaams, Indonesisch, BBQ, Kledingreparatie, Fietsreparatie, Oppas) |

**Algemene regel:** Elke taxonomy **item** en **group** in `MARKETPLACE_TAXONOMY` heeft een Lucide `icon`. Ontbrekende gebruikersvoorbeelden = ontbrekende taxonomy-items, niet ontbrekende icon-infrastructuur.

---

### Onderzoeksvraag 9 — Beschikbare Metadata

#### Per subcategorie (`MarketplaceTaxonomyItem`)

| Veld | Aanwezig | Voorbeeld |
|------|----------|-----------|
| `icon` | **Ja** (verplicht) | `'CakeSlice'`, `'Leaf'`, `'User'` |
| `emoji` | **Nee** | Alleen op main categories (`MAIN_CATEGORY_REGISTRY`) |
| `image` / `imageUrl` | **Nee** | Geen afbeeldings-URL in taxonomy |
| `badge` (component) | **Afgeleid** | Via `resolveOfferBadges()` → `ResolvedOfferBadge` |
| `color` | **Ja** (via `tone`) | `TAXONOMY_TONE_CLASSES` in `taxonomy-tone.ts` |
| `labelKey` | **Ja** | `marketplace.taxonomy.{id}.label` |
| `shortLabelKey` | **Optioneel** | Zeldzaam gebruikt |
| `searchTerms` | **Optioneel** | `['basilicum', 'basil']` |
| `parentId` | **Ja** (items) | `grp.grow.herbs` |
| `tone` | **Ja** | `food`, `garden`, `creative`, `artistic`, `service`, `knowledge`, `international` |
| `regulated` / `futureOnly` / `blocked` | **Optioneel** | Moderatie vlaggen |

**Kleur-mapping (tone → Tailwind classes):**

```4:13:lib/marketplace/taxonomy-tone.ts
export const TAXONOMY_TONE_CLASSES: Record<TaxonomyTone, string> = {
  food: 'bg-orange-50 text-orange-800 border-orange-200/80',
  garden: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
  creative: 'bg-purple-50 text-purple-800 border-purple-200/80',
  artistic: 'bg-pink-50 text-pink-800 border-pink-200/80',
  service: 'bg-sky-50 text-sky-800 border-sky-200/80',
  // ...
};
```

#### Per hoofdcategorie (`MainCategoryContract`)

| Veld | Voorbeeld |
|------|-----------|
| `emoji` / `icon` | `'🍳'` |
| `lucideIcon` | `'UtensilsCrossed'` |
| `labelKey` | `marketplace.valueExchange.categories.homeCheff` |
| `marketplaceCategories` | `['CREATE']` |

#### Resolved badge (runtime)

```9:15:lib/marketplace/taxonomy-badges.ts
export type ResolvedOfferBadge = {
  kind: 'taxonomy' | 'category';
  id: string;
  labelKey: string;
  icon: string;
  tone: TaxonomyTone;
};
```

#### UI-rendering van metadata

| Surface | Icoon gebruikt? | Labels? | Bron |
|---------|-----------------|---------|------|
| Detail badges (`MarketplaceBadgeList`) | **Ja** — Lucide via `TaxonomyLucideIcon` | **Ja** | `taxonomy-badges.ts` |
| Create/edit pickers (`AcceptedValuesPicker`, `MarketplaceEntryFlow`) | **Ja** | **Ja** | `TaxonomyLucideIcon` |
| Feed tile overlay (`TileBadgeRow`) | **Nee** | **Ja** — tekst only | `build-tile-badges.ts` → `TileBadge.label` |
| Preview accepted values | **Nee** | **Ja** — translated labels | `build-preview-accepted.ts` |
| Exchange suggestions | **Ja** — main category **emoji** | **Ja** | `mainCategoryEmoji()` |

```48:51:components/marketplace/MarketplaceBadge.tsx
      {showIcon ? (
        <TaxonomyLucideIcon name={badge.icon} className={sizeClasses.icon} />
      ) : null}
      <span className="truncate">{t(badge.labelKey)}</span>
```

```37:46:components/marketplace/tiles/primitives/TileBadgeRow.tsx
      {badges.map((badge) => (
        <span
          key={`${badge.kind}-${badge.label}`}
          className={cn(
            'inline-flex max-w-full items-center truncate rounded-lg px-2 py-0.5 text-[10px] font-semibold shadow-sm ring-1',
            TONE_CLASS[badge.tone],
          )}
        >
          {badge.label}
        </span>
```

**Conclusie Q9:** Subcategorieën hebben rijke metadata (`icon`, `tone`, `labelKey`, `searchTerms`). Geen emoji, geen image-URL. Kleur loopt via `tone`.

---

### Onderzoeksvraag 10 — Tile Readiness (iconen)

#### Opties

| Optie | Haalbaar vandaag? | Onderbouwing |
|-------|-------------------|--------------|
| **A. Alleen hoofdcategorie-iconen** | **Ja** (data + helper) | `MAIN_CATEGORY_REGISTRY` + `mainCategoryEmoji()`; afleiden via `marketplaceCategoryToMainCategory()` |
| **B. Hoofdcategorie + subcategorie-iconen** | **Ja** (data; feed tiles niet wired) | Elke taxonomy item heeft `icon`; `resolveOfferBadges()` levert `icon` + `tone`; `TaxonomyLucideIcon` rendert ze op detail/create |
| **C. Hoofdcategorie + subcategorie-labels** | **Ja** (deels live op tiles) | `buildTileBadges` toont al vertaalde subcategorie-**tekst** op tile overlay; geen main-category emoji |
| **D. Geen van bovenstaande** | **Nee** | Registries en resolvers bestaan |

#### Antwoord: **B** (met kanttekening)

De Tile Redesign kan **hoofdcategorie-emoji's én subcategorie-Lucide-iconen** gebruiken — alle metadata is centraal aanwezig. Feed tiles gebruiken die iconen **nog niet**; ze tonen alleen tekstlabels via `TileBadgeRow`.

**Wat al werkt (B):**

```89:102:lib/marketplace/taxonomy-badges.ts
  if (taxonomyIds.length > 0) {
    return taxonomyIds
      .map((id) => {
        const item = getMarketplaceTaxonomyItem(id);
        if (!item) return null;
        return {
          kind: 'taxonomy' as const,
          id,
          labelKey: item.labelKey,
          icon: item.icon,
          tone: item.tone,
        };
      })
```

**Wat ontbreekt voor 5B tiles:**

1. `buildTileBadges` → `TileBadge` strippt `icon` weg (alleen `label` + `tone`)
2. Geen `offerMainCategory` op `MarketplaceTileModel`
3. `resolveSurfaceIconPlan` (main-category emoji policy per tier) niet gekoppeld aan tiles
4. Legacy listings zonder taxonomy-id → fallback naar category Lucide, niet subcategorie

**A is een subset van B** — minder informatie, wel minder wiring.  
**C is al deels live** — labels zonder iconen op feed tiles.  
**B is het rijkste profiel dat de huidige data ondersteunt.**

#### Aanbevolen tile-icon strategie voor 5B

```
Tile image overlay:
  offerMainCategory emoji  ← MAIN_CATEGORY_REGISTRY (één icoon)

Onder prijsregel:
  payment emoji            ← PAYMENT_METHOD_REGISTRY
  accepted main emojis     ← mainCategoriesFromTaxonomyIds(acceptedSpecializations), max 3

Optioneel compact:
  offer subcategory Lucide ← resolveOfferBadgeByTaxonomyId(specializations[0])
```

---

## Validation references

Existing scripts that touch this data (not run as part of this audit):

```bash
npx tsx scripts/validate-value-exchange-system.ts
npx tsx scripts/validate-exchange-foundation.ts
npx tsx scripts/validate-marketplace-tile-system.ts
npx tsx scripts/validate-marketplace-detail-system.ts
```

---

## Conclusie

| Question | Answer |
|----------|--------|
| Q1 Listing categories | 6 Prisma + 8 icon main categories; subcategories = taxonomy dot-ids in `specializations[]` |
| Q2 Accepted counter-value | **JA** — subcategory taxonomy ids in `acceptedSpecializations[]`; main categories derived; multi-select supported |
| Q3 Subcategory examples | Basilicum **JA**, Portret **JA**, Surinaamse maaltijd **NEE** (no taxonomy item) |
| Q4 Wish description | **Gedeeltelijk** — listing description only; no per-value wish field |
| Q5 Matching usage | Main + subcategory **used**; descriptions **not used**; acceptance inactive without `barterOpenness` |
| Q6 Tile redesign ready | **NEE** — P0 gaps: `barterOpenness`, `offerMainCategory` on tiles, icon display wiring |
| Q7 Category registry | 8 main categories — emoji + Lucide in `MAIN_CATEGORY_REGISTRY`; centraal beheerd |
| Q8 Subcategory icons | **JA** — elke taxonomy item/group heeft Lucide `icon`; 10/15 voorbeelden gedekt |
| Q9 Metadata | `icon`, `tone`, `labelKey`, `searchTerms`; geen emoji/image per subcategorie |
| Q10 Tile icon readiness | **B** — hoofd- + subcategorie-icon data bestaat; feed tiles tonen nu alleen tekstlabels |
| Q7 Category registry | 8 main categories — emoji + Lucide in `MAIN_CATEGORY_REGISTRY`; centraal beheerd |
| Q8 Subcategory icons | **JA** — elke taxonomy item/group heeft Lucide `icon`; 10/15 voorbeelden gedekt |
| Q9 Metadata | `icon`, `tone`, `labelKey`, `searchTerms`; geen emoji/image per subcategorie |
| Q10 Tile icon readiness | **B** — hoofd- + subcategorie-icon data bestaat; feed tiles tonen nu alleen tekstlabels |
