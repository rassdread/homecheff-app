# Marketplace Taxonomy Coverage Audit

**Date:** 2026-07-06  
**Purpose:** Volledig inzicht in daadwerkelijke taxonomy-dekking vóór Marketplace Tile Redesign (Phase 5B)  
**Scope:** Read-only inventarisatie — geen code-, schema- of registry-wijzigingen  
**Status:** Complete  
**Related:** [MARKETPLACE_VALUE_EXCHANGE_DATA_AUDIT.md](./MARKETPLACE_VALUE_EXCHANGE_DATA_AUDIT.md) (Category Icon & Visual Metadata Audit)

---

## Executive summary

De centrale taxonomy staat in `lib/marketplace/taxonomy.ts` (`MARKETPLACE_TAXONOMY`):

| Metriek | Aantal |
|---------|--------|
| Groups (navigatielaag) | 13 |
| Items (subcategorieën) | 96 |
| Selecteerbaar (offer/request/accepted) | **86** |
| `futureOnly` (verborgen) | 2 |
| `blocked` (moderatie, nooit selecteerbaar) | 8 |

**Prisma `MarketplaceCategory` (6):** `CREATE`, `GROW`, `DESIGN`, `ARTISTIC_SERVICE`, `PRACTICAL_SERVICE`, `KNOWLEDGE`  
**Value-exchange hoofdcategorieën (8):** afgeleid via `MAIN_CATEGORY_REGISTRY` + `marketplaceCategoryToMainCategory()` — `DELIVERY` en `REQUESTS` hebben **geen** taxonomy-items.

**Kernbevindingen:**

1. V2 **nieuwe** listings (dorpsplein) kiezen uit alle 86 taxonomy-items via `MarketplaceEntryFlow`.
2. **Bewerken** gebruikt nog legacy `Compact*Form` met Nederlandse vrije-tekst subcategorieën — geen volledige taxonomy-picker.
3. Veel HomeCheff-visie use-cases (Surinaams, BBQ, Oppas, Kamerplanten, Lifestyle-coaching) **ontbreken** in de registry.
4. Exchange matching (4D/4F/4G) werkt op **exacte taxonomy dot-ids** — legacy subcategory-strings matchen niet.
5. Tile Redesign kan **detail** en **preview-labels** veilig op taxonomy baseren; **tile hoofd-/acceptatie-iconen** nog niet zonder extra wiring.

---

## Bronnen (single source of truth)

| Bron | Pad | Rol |
|------|-----|-----|
| Taxonomy registry | `lib/marketplace/taxonomy.ts` | Alle groups + items |
| Type contract | `lib/marketplace/taxonomy-types.ts` | `MarketplaceTaxonomyItem` |
| Resolve / filters | `lib/marketplace/taxonomy-resolve.ts` | Selecteerbaarheid per rol |
| i18n labels (NL) | `public/i18n/nl.json` → `marketplace.taxonomy.*` | UI-labels |
| Main category map | `lib/marketplace/value-exchange/category-taxonomy-map.ts` | Taxonomy → 8 icon-hoofdcategorieën |
| Main category registry | `lib/marketplace/value-exchange/main-categories.ts` | Emoji + Lucide |
| Listing categories | `lib/marketplace/listing-taxonomy.ts` | 6 Prisma-categorieën |
| Entry flow UI | `components/products/marketplace/MarketplaceEntryFlow.tsx` | Plaatsen (V2) |
| Offer form | `components/products/marketplace/MarketplaceOfferForm.tsx` | Formulier + accepted values |
| Accepted values | `components/products/marketplace/AcceptedValuesPicker.tsx` | Ruil-tegenwaarde multi-select |
| Legacy edit | `components/products/CompactChefForm.tsx` etc. | Bewerken + inspiratie |
| Legacy → taxonomy | `lib/marketplace/taxonomy-migrate.ts` | Slug-mapping bij lezen |

---

## Onderzoeksvraag 1 — Volledige Taxonomy Export

Labels = NL i18n (`marketplace.taxonomy.*`). ID tussen haakjes = canonical dot-id opgeslagen in `specializations[]`.

### 🍳 HomeCheff (`CREATE` → `HOME_CHEFF`)

#### Eten & homemade (`grp.create.meals`)

- Maaltijden (`create.meal`)
- Bakken (`create.baking`)
- Brood (`create.bread`)
- Taart (`create.cake`)
- Cupcakes (`create.cupcakes`)
- Koekjes (`create.cookies`)
- Soep (`create.soup`)
- Pasta (`create.pasta`)
- Rijst (`create.rice`)
- Catering (`create.catering`)

#### Ambacht & handmade (`grp.create.craft`)

- Kleding (`create.clothing`)
- Sieraden (`create.jewelry`)
- Decoratie (`create.decoration`)
- Kunst (`create.art`)

#### Internationaal & ambachtelijk (`grp.create.international`)

- Koffie (`create.coffee`)
- Thee (`create.tea`)
- Cacao (`create.cacao`)
- Olijfolie (`create.olive_oil`)
- Kruiden & specerijen (`create.spices`)
- Sauzen (`create.sauces`)
- Conserven & jam (`create.preserves`)
- Wijn & wijngaard (`create.wine_vineyard`) — **futureOnly, verborgen**
- Craftbier (`create.craft_beer`) — **futureOnly, verborgen**

---

### 🌱 HomeGarden (`GROW` → `HOME_GARDEN`)

#### Groente (`grp.grow.vegetables`)

- Groente (`grow.vegetables`)
- Tomaat (`grow.tomato`)
- Wortel (`grow.carrot`)
- Paprika (`grow.pepper`)
- Komkommer (`grow.cucumber`)
- Aardappel (`grow.potato`)
- Ui (`grow.onion`)
- Knoflook (`grow.garlic`)

#### Fruit (`grp.grow.fruit`)

- Fruit (`grow.fruit`)
- Appel (`grow.apple`)
- Peer (`grow.pear`)
- Sinaasappel (`grow.orange`)
- Citroen (`grow.lemon`)
- Banaan (`grow.banana`)
- Druiven (`grow.grapes`)
- Aardbei (`grow.strawberry`)
- Bosbes (`grow.blueberry`)
- Mango (`grow.mango`)
- Ananas (`grow.pineapple`)
- Avocado (`grow.avocado`)
- Olijven (`grow.olives`)

#### Kruiden (`grp.grow.herbs`)

- Kruiden (`grow.herbs`)
- Basilicum (`grow.basil`)
- Munt (`grow.mint`)
- Peterselie (`grow.parsley`)
- Rozemarijn (`grow.rosemary`)
- Tijm (`grow.thyme`)
- Oregano (`grow.oregano`)

#### Planten & overig (`grp.grow.other`)

- Planten (`grow.plants`)
- Honing (`grow.honey`)

---

### 🎨 HomeDesigner — Design (`DESIGN` → `HOME_DESIGNER`)

#### Websites & apps (`grp.design.web`)

- Website (`design.website`)
- Webshop (`design.webshop`)
- App (`design.app`)
- UI/UX-design (`design.uiux`)

#### Branding & marketing (`grp.design.brand`)

- Logo (`design.logo`)
- Branding (`design.branding`)
- Marketing (`design.marketing`)
- SEO (`design.seo`)

#### Media & design (`grp.design.media`)

- Video (`design.video`)
- Fotografie (`design.photo`)
- Illustratie (`design.illustration`)
- Animatie (`design.animation`)

---

### 🎨 HomeDesigner — Artistieke diensten (`ARTISTIC_SERVICE` → `HOME_DESIGNER`)

#### Artistieke diensten (`grp.artistic.all`)

- Tattoo (`artistic.tattoo`) — `regulated: age_restricted`
- Nagels (`artistic.nails`)
- Make-up (`artistic.makeup`)
- Bodypaint (`artistic.bodypaint`)
- Airbrush (`artistic.airbrush`)
- Muurschildering (`artistic.mural`)
- Schilderen (`artistic.painting`)
- Portret (`artistic.portrait`)
- Muziek (`artistic.music`)
- Zang (`artistic.voice`)

---

### 🔧 Diensten (`PRACTICAL_SERVICE` → `SERVICES`)

#### Praktische diensten (`grp.practical.all`)

- Tuinwerk (`practical.gardenwork`)
- Schoonmaak (`practical.cleaning`)
- Verhuishulp (`practical.movinghelp`)
- Computerhulp (`practical.computerhelp`)
- Reparatie (`practical.repair`)
- Klushulp (`practical.handyman`)
- Montage (`practical.assembly`)

---

### 📚 Workshops (`KNOWLEDGE` → `WORKSHOPS`, via `category-taxonomy-map.ts`)

#### Kennis & workshops (`grp.knowledge.all`)

- Workshop (`knowledge.workshop`)
- Kookles (`knowledge.cookingclass`)
- Muziekles (`knowledge.musicclass`)
- Bijles (`knowledge.tutoring`)
- Taalles (`knowledge.language`)

---

### 🎓 Coaching (`KNOWLEDGE` → `COACHING`, alleen `knowledge.coaching`)

#### Kennis & workshops (`grp.knowledge.all`)

- Coaching (`knowledge.coaching`)

---

### 🚚 Bezorging (`DELIVERY`)

**Geen taxonomy-items.** `MAIN_CATEGORY_REGISTRY.DELIVERY` heeft `marketplaceCategories: []`. Dekking via fulfillment-vlaggen (`pickup`, `delivery`, …) in `lib/marketplace/listing-taxonomy.ts` → `defaultFulfillmentForCategory()` en product-fulfillment JSON.

---

### 🙋 Verzoeken (`REQUESTS`)

**Geen aparte taxonomy-items.** `listingIntent: REQUEST` gebruikt dezelfde 86 items als offer, met rol `request` in `MarketplaceEntryFlow`. REQUEST-profielen mappen `specializations[]` naar `desiredExchanges[].subcategoryId` in `exchange-suggestion-profile-mapper.ts`.

---

### Blocklist (nooit selecteerbaar)

Moderatie-items in `CREATE`, `blocked: true`:

- Dropshipping (`blocked.dropshipping`)
- Wederverkoop (`blocked.resale`)
- Verhuur (`blocked.rental`)
- Medische behandeling (`blocked.medical_treatment`)
- Botox & fillers (`blocked.botox_fillers`)
- Gezondheidsclaims (`blocked.health_claims`)
- Financieel advies (`blocked.financial_advice`)
- Juridische vertegenwoordiging (`blocked.legal_representation`)

---

## Onderzoeksvraag 2 — Gebruik in Listing Flows

### Flow-overzicht

| Flow | Component | Wanneer | Taxonomy-bron |
|------|-----------|---------|---------------|
| Nieuw item (dorpsplein V2) | `MarketplaceEntryFlow` → `MarketplaceOfferForm` | `useMarketplaceV2 && !editMode` | Volledige registry |
| Item bewerken | `CompactChefForm` / `CompactGardenForm` / `CompactDesignerForm` | `editMode === true` | Legacy NL-strings |
| Inspiratie | Zelfde Compact-forms | `platform === 'inspiratie'` | Legacy NL-strings |
| Geaccepteerde tegenwaarde | `AcceptedValuesPicker` | In `MarketplaceOfferForm` (V2 nieuw) | `getAcceptedValueTaxonomyItems()` |

```59:86:components/products/CategoryFormSelector.tsx
  if (platform === 'dorpsplein' && useMarketplaceV2 && !editMode) {
    if (!entryResult) {
      return (
        <MarketplaceEntryFlow
          ...
        />
      );
    }
    return (
      <MarketplaceOfferForm
        ...
      />
    );
  }
  // editMode / inspiratie → Compact*Form
```

### Selecteerbaarheid per registry-status

| Status | Aantal | Definitie (code) |
|--------|--------|------------------|
| **Bestaat in taxonomie** | 96 items + 13 groups | `MARKETPLACE_TAXONOMY` |
| **Daadwerkelijk selecteerbaar** (offer/request/accepted) | **86** | `getOfferTaxonomyItems()` / `getRequestTaxonomyItems()` / `getAcceptedValueTaxonomyItems()` — `level === 'item'`, niet `blocked`, niet `futureOnly` |
| **Verborgen** | **2** | `create.wine_vineyard`, `create.craft_beer` (`futureOnly: true`) |
| **Moderatie / nooit in picker** | **8** | `blocked.*` (`blocked: true`) |
| **Groups (navigatie)** | **13** | `allowedAsOffer/Request/AcceptedValue: false` — niet opgeslagen als specialization |

### Per Prisma-categorie — selecteerbare items (offer-rol)

| Categorie | Selecteerbaar | Entry-flow groups |
|-----------|---------------|-------------------|
| `CREATE` | 21 | meals, craft, international |
| `GROW` | 30 | vegetables, fruit, herbs, other |
| `DESIGN` | 12 | web, brand, media |
| `ARTISTIC_SERVICE` | 10 | artistic.all |
| `PRACTICAL_SERVICE` | 7 | practical.all |
| `KNOWLEDGE` | 6 | knowledge.all |

Filterlogica:

```78:86:lib/marketplace/taxonomy-resolve.ts
export function getEntryFlowItemsForGroup(
  groupId: string,
  role: TaxonomyEntryRole,
  options?: TaxonomyResolveOptions,
): MarketplaceTaxonomyItem[] {
  return getMarketplaceTaxonomyItemsByParent(groupId, options).filter((entry) =>
    itemAllowedForRole(entry, role),
  );
}
```

### Legacy subcategorieën (bewerken) — buiten taxonomy

Compact-forms gebruiken vaste Nederlandse arrays, **niet** gekoppeld aan `MARKETPLACE_TAXONOMY`:

**CHEFF** (`CompactChefForm.tsx`): Hoofdgerecht, Voorgerecht, Dessert, Snack, Soep, Salade, Pasta, Rijst, Vegetarisch, Veganistisch, Glutenvrij, Lactosevrij, Seizoen, Feestdagen, **BBQ**, **Bakken**, **Wereldkeuken**

**GARDEN** (`CompactGardenForm.tsx`): Groenten, Fruit, Kruiden, Bloemen, Bomen, Cactussen, **Vetplanten**, **Kamerplanten**, Tuinplanten, Moestuin, Biologisch, Zaadjes, **Stekjes**, Seizoensgroente, Exotisch, Compost

**DESIGNER** (`CompactDesignerForm.tsx`): Meubels, Decoratie, Kleding, Accessoires, Schilderijen, Beelden, Fotografie, Keramiek, Houtwerk, Metaalwerk, Textiel, Digitale kunst, Upcycling, Vintage, Modern, **Handgemaakt**

→ Opgeslagen als `Product.subcategory` (vrije string). Alleen gemigreerd naar taxonomy-ids als slug in `taxonomy-migrate.ts` staat.

### Samenvatting Q2

| Item-type | Bestaat | Selecteerbaar V2 nieuw | Selecteerbaar edit/legacy |
|-----------|---------|------------------------|---------------------------|
| 86 canonical items | Ja | Ja | Nee (tenzij al in DB als id) |
| 2 alcohol items | Ja | Nee (`futureOnly`) | Nee |
| 8 blocked items | Ja | Nee | Nee |
| Legacy NL subcategories | Nee (niet in registry) | Nee | Ja (vrije dropdown) |

---

## Onderzoeksvraag 3 — Coverage Audit

Vergelijking met HomeCheff-visie use-cases. Status: **aanwezig** = dedicated taxonomy-item; **gedeeltelijk** = generiek item of alleen legacy/fulfillment; **ontbreekt** = geen item, geen searchTerm-match.

### HomeCheff (`CREATE`)

| Use-case | Status | Taxonomy / opmerking |
|----------|--------|----------------------|
| Surinaams | **Ontbreekt** | Geen item, geen searchTerm |
| Indonesisch | **Ontbreekt** | — |
| Antilliaans | **Ontbreekt** | — |
| BBQ | **Ontbreekt** | Legacy CHEF dropdown heeft "BBQ"; geen `create.*` item |
| Bakken | **Aanwezig** | `create.baking` |
| Taarten | **Gedeeltelijk** | `create.cake` (label "Taart"); ook `create.cupcakes`, `create.cookies` |
| Catering | **Aanwezig** | `create.catering` |
| Maaltijdservice | **Gedeeltelijk** | `create.meal` (Maaltijden); geen "maaltijdservice"-item |

### HomeGarden (`GROW`)

| Use-case | Status | Taxonomy / opmerking |
|----------|--------|----------------------|
| Kruiden | **Aanwezig** | `grow.herbs` + 6 specifieke kruiden |
| Groenten | **Aanwezig** | `grow.vegetables` + 7 specifieke groenten |
| Fruit | **Aanwezig** | `grow.fruit` + 12 specifieke fruitsoorten |
| Kamerplanten | **Gedeeltelijk** | `grow.plants` (label "Planten"); legacy "Kamerplanten" niet gemapt |
| Stekjes | **Ontbreekt** | Legacy GARDEN dropdown wel; geen taxonomy-item |
| Tuinonderhoud | **Gedeeltelijk** | `practical.gardenwork` (dienst, niet GROW-product) |

### HomeDesigner (`DESIGN` + `ARTISTIC_SERVICE`)

| Use-case | Status | Taxonomy / opmerking |
|----------|--------|----------------------|
| Portret | **Aanwezig** | `artistic.portrait` |
| Schilderij | **Gedeeltelijk** | `artistic.painting` (dienst "Schilderen"); legacy "Schilderijen" als product |
| Logo | **Aanwezig** | `design.logo` |
| Illustratie | **Aanwezig** | `design.illustration` |
| Kledingreparatie | **Ontbreekt** | `create.clothing` = product; `practical.repair` = generiek |
| Handgemaakt | **Gedeeltelijk** | Legacy DESIGNER dropdown; geen taxonomy-item |

### Diensten (`PRACTICAL_SERVICE`)

| Use-case | Status | Taxonomy / opmerking |
|----------|--------|----------------------|
| Oppas | **Ontbreekt** | Geen item |
| Schoonmaak | **Aanwezig** | `practical.cleaning` |
| Fietsreparatie | **Gedeeltelijk** | `practical.repair` (generiek "Reparatie") |
| Computerhulp | **Aanwezig** | `practical.computerhelp` |
| Klusjes | **Gedeeltelijk** | `practical.handyman` (label "Klushulp") |

### Workshops (`KNOWLEDGE` → WORKSHOPS)

| Use-case | Status | Taxonomy / opmerking |
|----------|--------|----------------------|
| Koken | **Aanwezig** | `knowledge.cookingclass` |
| Tuinieren | **Ontbreekt** | Geen workshop-item |
| Creatief | **Gedeeltelijk** | `knowledge.workshop` (generiek) |

### Coaching (`KNOWLEDGE` → COACHING)

| Use-case | Status | Taxonomy / opmerking |
|----------|--------|----------------------|
| Lifestyle | **Ontbreekt** | — |
| Sport | **Ontbreekt** | — |
| Ondernemen | **Ontbreekt** | — |
| (generiek) | **Gedeeltelijk** | Alleen `knowledge.coaching` |

### Bezorging (`DELIVERY`)

| Use-case | Status | Taxonomy / opmerking |
|----------|--------|----------------------|
| Ophalen | **Aanwezig** | Fulfillment `pickup` — geen taxonomy-id |
| Bezorgen | **Aanwezig** | Fulfillment `delivery` — geen taxonomy-id |

### Verzoeken (`REQUESTS`)

| Use-case | Status | Taxonomy / opmerking |
|----------|--------|----------------------|
| Gezocht | **Aanwezig** | `listingIntent: REQUEST` + taxonomy specializations |
| Hulp gevraagd | **Gedeeltelijk** | Zelfde REQUEST-mechanisme; geen apart sublabel in registry |

**Score visie-matrix:** 15 aanwezig · 14 gedeeltelijk · 13 ontbreekt (van 42 gecontroleerde use-cases).

---

## Onderzoeksvraag 4 — Matching Readiness

### Wat matching gebruikt

Exchange stack (4D) leest **canonical taxonomy dot-ids**:

```80:100:lib/marketplace/exchange/exchange-resolver.ts
export function buildExchangeOfferModel(input: {
  ...
  specializationIds: string[];
}): ExchangeOfferModel {
  const primary = input.specializationIds[0] ?? null;
  const item = primary ? getMarketplaceTaxonomyItem(primary) : null;
  const mainCategory = marketplaceCategoryToMainCategory(
    input.marketplaceCategory ?? 'CREATE',
    primary,
    input.listingKind,
  );
  return {
    mainCategory,
    subcategoryIds: input.specializationIds,
    ...
  };
}
```

Overlap = exacte id-intersectie:

```65:75:lib/marketplace/exchange/exchange-overlap.ts
  const aSubs = unique([
    ...offerSubcategories(a),
    ...acceptedSubcategories(a),
    ...desiredSubcategories(a),
  ]);
  ...
  const sharedSubcategoryIds = intersect(aSubs, bSubs);
```

Acceptatie actief alleen bij `barterOpenness` ∈ `{BARTER_ONLY, MONEY_AND_BARTER}`:

```103:109:lib/marketplace/exchange/exchange-resolver.ts
  const openness = String(input.barterOpenness ?? 'MONEY').toUpperCase() as BarterOpenness;
  if (openness === 'MONEY') return null;
```

### Per subsystem

| Subsystem | Ondersteuning | Details |
|-----------|---------------|---------|
| **Exchange Matching (4D)** | **Gedeeltelijk** | Alle 86 items werken als `specializationIds` / `acceptedSpecializations` / REQUEST `desiredExchanges`. **Beperkingen:** (1) `barterOpenness` default `MONEY` → acceptatie genegeerd; (2) legacy `subcategory` strings tellen niet mee; (3) main-category overlap werkt ook zonder exacte subcat-match |
| **Exchange Suggestions (4F)** | **Gedeeltelijk** | Resolver gebruikt 4D; cards tonen `mainCategory` emoji (`exchange-suggestion-category-icon.ts`), niet subcategorie-iconen. Classificatie gebruikt `sharedSubcategoryIds` en `sharedMainCategories` |
| **Exchange Feed Inserts (4G)** | **Gedeeltelijk** | Zelfde resolver + caps; `mainCategory` op card. Geen taxonomy-specifieke feed-filter |

### Per taxonomy-item type

| Type | Matching |
|------|----------|
| 86 selecteerbare items | **Volledig ondersteund** (bij canonical ids op listing) |
| 2 `futureOnly` | **Niet ondersteund** (niet selecteerbaar → niet op listings) |
| 8 `blocked` | **Niet ondersteund** |
| Legacy NL subcategories | **Niet ondersteund** (tenzij toevallig slug in `taxonomy-migrate.ts`) |
| Fulfillment (pickup/delivery) | **Niet gebruikt** in exchange overlap |
| Main categories (8) | **Volledig ondersteund** (afgeleid via `category-taxonomy-map.ts`) |

### Score-gewichten (subcategorie telt zwaar)

```32:40:lib/marketplace/exchange/exchange-match-score.ts
export const DEFAULT_EXCHANGE_SCORE_WEIGHTS: ExchangeScoreWeights = {
  categoryOverlap: 0.22,
  subcategoryOverlap: 0.28,
  desiredExchangeOverlap: 0.25,
  ...
};
```

Ontbrekende taxonomy-items (Surinaams, Oppas, …) = **geen subcategory-match mogelijk** voor die use-cases, ook niet via searchTerms.

---

## Onderzoeksvraag 5 — Tile Readiness

Antwoord per UI-surface op basis van **huidige** code — niet geplande 5B-wiring.

### Tegel

| Vereiste | JA/NEE | Onderbouwing |
|----------|--------|--------------|
| Hoofdcategorie badge | **NEE** | `MarketplaceTileModel` heeft geen `offerMainCategory`. `buildTileBadges` gebruikt taxonomy **tekstlabels**, geen main-category emoji. `resolveSurfaceIconPlan` bestaat maar is **niet gekoppeld** aan tiles |
| Geaccepteerde categorie-iconen | **NEE** | `buildTileBadges` toont max 1 accepted **label** (standard variant); geen iconen, geen main-category emoji's. `TILE_ICON_DISPLAY_RULES.hideSubcategoriesOnTile: true` |

```53:69:lib/marketplace/tiles/types.ts
export type MarketplaceTileModel = {
  ...
  specializations: string[];
  acceptedSpecializations: string[];
  barterOpenness: string | null;
  // geen offerMainCategory
};
```

```104:120:lib/marketplace/tiles/build-tile-badges.ts
    if (offerBadges[0]) {
      out.push({
        kind: 'specialization',
        label: t(offerBadges[0].labelKey),
        tone: 'default',
      });
    }
  ...
    if (accepted[0]) {
      out.push({
        kind: 'accepted_value',
        label: t(accepted[0].labelKey),
```

### Preview

| Vereiste | JA/NEE | Onderbouwing |
|----------|--------|--------------|
| Subcategorie-iconen | **NEE** | `buildPreviewAcceptedValues` mapt alleen `id` + `label`; geen `TaxonomyLucideIcon`. `resolveSurfaceIconPlan` zet `showSubcategories: false` voor preview-tier |
| Subcategorie-labels | **JA** | `resolveAcceptedBadges` + `resolveOfferBadges` leveren `labelKey`; preview en tile tonen vertaalde labels |

```6:18:lib/marketplace/previews/build-preview-accepted.ts
export function buildPreviewAcceptedValues(...) {
  const badges = resolveAcceptedBadges(model.acceptedSpecializations);
  const mapped = badges.map((b) => ({
    id: b.id,
    label: t(b.labelKey),
  }));
```

### Detail

| Vereiste | JA/NEE | Onderbouwing |
|----------|--------|--------------|
| Volledige taxonomy-hiërarchie | **JA** | `ProductOfferedBadgesSection` / `ProductAcceptedBadgesSection` → `MarketplaceBadgeList` met `showIcon` en alle `specializations` / `acceptedSpecializations` via `resolveOfferBadges` / `resolveAcceptedBadges` |

```28:34:components/product/detail/ProductOfferedBadgesSection.tsx
      <MarketplaceBadgeList
        specializations={specializations}
        marketplaceCategory={marketplaceCategory}
        legacyCategory={legacyCategory}
        size="md"
        showIcon
      />
```

**Groups** (meals, herbs, …) worden op detail **niet** als aparte hiërarchie-laag getoond — alleen geselecteerde item-badges. Parent-group is impliciet via taxonomy-metadata, niet in UI.

### Tile Redesign — veilig uitgaan van?

| Surface | Veilig vandaag? |
|---------|-----------------|
| Tegel (hoofd + acceptatie iconen) | **NEE** — data in registry, niet op tile model / niet gerenderd |
| Preview (subcat iconen) | **NEE** |
| Preview (subcat labels) | **JA** |
| Detail (taxonomy items + iconen) | **JA** (items, niet group-tree) |

---

## Onderzoeksvraag 6 — Taxonomy Gaps

### Ontbrekende categorieën (aanbevolen vóór definitieve Tile Redesign)

**Prioriteit P0 — HomeCheff-identiteit / veelvoorkomend in legacy UI**

| Voorgesteld item | Reden |
|------------------|-------|
| `create.cuisine.surinamese` (of vergelijkbaar) | Surinaams — geen dekking |
| `create.cuisine.indonesian` | Indonesisch |
| `create.cuisine.caribbean` | Antilliaans |
| `create.bbq` | Legacy CHEF "BBQ" |
| `create.world_cuisine` | Legacy "Wereldkeuken" |
| `grow.cuttings` / Stekjes | Legacy GARDEN "Stekjes" |
| `grow.houseplants` | Kamerplanten (nu alleen generiek `grow.plants`) |
| `practical.childcare` | Oppas |
| `practical.bike_repair` | Fietsreparatie (nu generiek `practical.repair`) |
| `practical.clothing_repair` | Kledingreparatie |
| `knowledge.gardening_class` | Tuinieren workshop |

**Prioriteit P1 — Coaching / diensten verfijning**

| Voorgesteld item | Reden |
|------------------|-------|
| `knowledge.coaching.lifestyle` | Lifestyle coaching |
| `knowledge.coaching.sport` | Sport |
| `knowledge.coaching.business` | Ondernemen |
| `knowledge.creative_workshop` | Creatief (nu generiek `knowledge.workshop`) |

**Niet taxonomy maar wel P0 voor matching/tiles:** `barterOpenness` in create UI (zie Value Exchange Audit).

### Dubbele / overlappende categorieën

| Overlap | Items | Risico |
|---------|-------|--------|
| Kruiden product vs specerijen | `grow.herbs`, `grow.basil`, … vs `create.spices` | Zelfde zoekterm "kruiden"; verschillende main category (GROW vs CREATE) |
| Groente generiek vs specifiek | `grow.vegetables` vs `grow.tomato`, … | Gebruiker kan beide selecteren; matching op exacte id |
| Fruit generiek vs specifiek | `grow.fruit` vs `grow.apple`, … | Idem |
| Schilderen dienst vs kunst product | `artistic.painting` vs `create.art` | Verschillende Prisma-categorie, zelfde domein |
| Reparatie vs klushulp | `practical.repair` vs `practical.handyman` | Geen hiërarchie; beide generiek |
| Workshop vs kookles | `knowledge.workshop` vs `knowledge.cookingclass` | Workshop vangt alles; coaching los |
| KNOWLEDGE → WORKSHOPS vs COACHING | 5 workshop-items + 1 coaching-item | Zelfde Prisma-categorie, split alleen in `category-taxonomy-map.ts` |
| Legacy vs V2 | 47+ legacy NL strings vs 86 taxonomy ids | Dubbele waarheid op `Product.subcategory` vs `specializations[]` |

### Verouderde / inconsistente categorieën

| Item / systeem | Observatie |
|----------------|------------|
| Legacy `Compact*Form` subcategories | Nog actief bij **edit**; overlappen niet met V2 taxonomy |
| `create.art` onder `grp.create.craft` | Tone `creative` terwijl parent `food` group — inconsistent |
| `SPECIALIZATIONS` / `SUBCATEGORIES` in `listing-taxonomy.ts` | `@deprecated` lege objecten — dead API surface |
| `DESIGNER` legacy vertical | Product-gericht (Meubels, Keramiek); V2 split DESIGN vs ARTISTIC_SERVICE |
| Alcohol items | `futureOnly` — bewust buiten MVP, wel in registry |

### Aanbevelingen (niet implementeren — alleen voor 5B-planning)

1. **Taxonomy uitbreiden** met P0 cuisine-, tuin- en dienst-items vóór tile-iconen op cuisine-type baseren.
2. **Legacy edit migreren** naar `MarketplaceEntryFlow` of taxonomy-picker — anders blijft coverage-split tussen nieuw en bewerkt.
3. **Unificeer subcategory opslag** — `specializations[]` als enige bron; legacy `subcategory` migreren via uitgebreide `taxonomy-migrate.ts`.
4. **Tile model uitbreiden** met `offerMainCategory` + `acceptedMainCategories[]` (afgeleid via `mainCategoriesFromTaxonomyIds`).
5. **Wire `resolveSurfaceIconPlan`** per tier — registry is klaar; tiles/previews niet.
6. **Documenteer generiek vs specifiek** — beleid: alleen leaf-items selecteerbaar, of parent + child mutual exclusive?
7. **REQUEST + fulfillment** expliciet in tile-contract — geen taxonomy voor Bezorging/Gezocht, wel `listingIntent` + fulfillment flags.

---

## Conclusie

| Vraag | Antwoord |
|-------|----------|
| Q1 Volledige export | **96 items + 13 groups** — volledige lijst hierboven |
| Q2 Listing flows | **86 selecteerbaar** in V2 nieuw; **edit = legacy strings**; 2 verborgen, 8 blocked |
| Q3 Coverage | **15/42 aanwezig**, 14 gedeeltelijk, 13 ontbreekt t.o.v. visie-matrix |
| Q4 Matching | **Gedeeltelijk** — ids werken; legacy + ontbrekende items + `barterOpenness` beperken effect |
| Q5 Tile readiness | Tegel iconen **NEE**; preview labels **JA**; detail badges **JA** |
| Q6 Gaps | Zie P0/P1-lijst; legacy/V2-dualiteit is structureel risico |

**Voor Phase 5B:** Tile Redesign kan **taxonomy-labels en detail-iconen** vertrouwen. **Niet** veilig uitgaan van hoofdcategorie-badges op tiles of cuisine-/dienst-specifieke dekking zonder taxonomy-uitbreiding en model-wiring.

---

## Validation references

Bestaande scripts (niet uitgevoerd als onderdeel van deze audit):

```bash
npx tsx scripts/validate-value-exchange-system.ts
npx tsx scripts/validate-exchange-foundation.ts
npx tsx scripts/validate-exchange-suggestions.ts
npx tsx scripts/validate-exchange-feed.ts
npx tsx scripts/validate-marketplace-tile-system.ts
```
