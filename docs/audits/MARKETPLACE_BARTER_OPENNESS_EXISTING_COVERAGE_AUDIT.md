# Marketplace Phase 5B-C — Barter Openness Existing Coverage Audit

**Datum:** 2026-07-07  
**Scope:** Inventarisatie van `barterOpenness`, ruilbereidheid, exchange-intentie en gerelateerde velden. Geen nieuwe code, geen schema-wijzigingen.  
**Gerelateerde audits:** `MARKETPLACE_VALUE_EXCHANGE_DATA_AUDIT.md`, `MARKETPLACE_TILE_ICON_WIRING_AUDIT.md`, `MARKETPLACE_TAXONOMY_CONSOLIDATION_AUDIT.md`

---

## 1. Executive summary

**Kernconclusie:** Het datamodel en de backend voor ruilbereidheid zijn **grotendeels gebouwd** (Prisma-enum, API-parse/patch, matching, tile price line, detail-block builder, i18n). Wat **ontbreekt** is vooral de **schakel tussen gebruiker en database**: er is **geen UI** om `barterOpenness` in te stellen, en het **create/edit-payload stuurt het veld niet mee**.

Gevolg voor productiegedrag vandaag:

| Situatie | Gedrag |
|----------|--------|
| Gebruiker kiest alleen accepted values | `barterOpenness` blijft `null` → runtime default **`MONEY`** → **geen** exchange-acceptance in matching |
| Listing met `barterOpenness` in DB (API/script) | Matching, suggestions, tile price line en previews werken **wel** |
| Detailpagina | Toont **accepted-value badges**, maar **niet** expliciet “alleen verkoop / geld+ruil / alleen ruil” |
| Tile badges | Accepted-value badges **actief**; `barterSlot` **berekend maar niet gerenderd** |

**Hergebruiken (niet opnieuw bouwen):** `BarterOpenness`-enum, `parse-v2-payload` / `patch-v2-fields`, `PAYMENT_METHOD_REGISTRY`, `buildDetailValueExchangeBlock`, `buildTilePriceLine`, `buildPreviewPaymentBlock`, exchange-resolver stack (4D), exchange-suggestions (4F/4G), `AcceptedValuesPicker`, bestaande i18n onder `marketplace.valueExchange.payment.*`.

**Veiligste volgende stap (5B-D):** Eén **barter-openness keuze** in `MarketplaceOfferForm` (3 opties, bestaande copy/registry), veld meesturen in submit; detailpagina **aansluiten** op `buildDetailValueExchangeBlock` i.p.v. parallelle sectie bouwen; `barterSlot` alleen activeren als het iets toevoegt boven price line + accepted badges.

---

## 2. Bestaande velden

### 2.1 Zoektermen — wat bestaat / wat niet

| Term | Status | Locatie / opmerking |
|------|--------|---------------------|
| `barterOpenness` | **Bestaat** | Prisma `Product`, API, tile model, matching, discovery |
| `acceptedSpecializations` | **Bestaat** | Prisma `String[]`, create/edit UI, matching |
| `acceptedValueCategories` | **Afgeleid** | Geen DB-kolom; berekend in `resolveTileValueExchangeFields` |
| `acceptedValueSubcategories` | **Afgeleid** | Geen DB-kolom; gefilterde taxonomy-ids uit `acceptedSpecializations` |
| `exchangeOpenness` | **Niet gevonden** | Geen veld, type of i18n-key |
| `tradeOpenness` | **Niet gevonden** | Geen veld, type of i18n-key |
| `swap` / `barter` / `ruil` / `exchange` | **Conceptueel** | Verspreid over matching, copy, suggestions — geen apart datamodel |

### 2.2 Database & schema

```prisma
// prisma/schema.prisma — Product
barterOpenness          BarterOpenness?   // nullable, geen @default
acceptedSpecializations String[]          @default([])

enum BarterOpenness {
  MONEY
  MONEY_AND_BARTER
  BARTER_ONLY
}
```

**Migratie:** `prisma/migrations/20260705193000_marketplace_foundation_v2/migration.sql` — enum + nullable kolom, **geen default** op DB-niveau.

**Runtime-default:** Overal waar `barterOpenness` ontbreekt wordt **`MONEY`** aangenomen (`?? 'MONEY'`), o.a. in:

- `lib/marketplace/exchange/exchange-resolver.ts` → `buildExchangeAcceptanceModel`
- `lib/marketplace/value-exchange/barter-models.ts` → `buildBarterAcceptanceModel`
- `lib/marketplace/exchange-suggestions/exchange-suggestion-profile-mapper.ts` → `productRowIsSuggestionEligible`
- `lib/marketplace/tiles/build-tile-badges.ts` → `resolveBarterSlot`

### 2.3 Types & modellen

| Model | `barterOpenness` | Accepted-value velden |
|-------|------------------|------------------------|
| Prisma `Product` | `BarterOpenness?` | `acceptedSpecializations[]` |
| `MarketplaceTileModel` | `string \| null` | `acceptedValueCategories?`, `acceptedValueSubcategories?` (afgeleid) |
| `MarketplaceV2Payload` | `BarterOpenness \| null` | `acceptedSpecializations[]` |
| `ExchangeListingProfile` | via `acceptance.barterOpenness` | `acceptance.subcategoryIds` |
| `Proposal` | indirect via gekoppeld product | `acceptedValueTaxonomyIds[]` (proposal-niveau, apart van listing) |

**Afleiding accepted values op tiles:** `lib/marketplace/tiles/resolve-tile-value-exchange.ts` — filtert geldige taxonomy-ids uit `acceptedSpecializations`, mapt naar main categories.

### 2.4 Create/edit payloads

| Pad | `barterOpenness` | `acceptedSpecializations` |
|-----|------------------|---------------------------|
| `parseMarketplaceV2FromBody` | Parsed als `MONEY` / `MONEY_AND_BARTER` / `BARTER_ONLY` / `null` | Genormaliseerd via `normalizeAcceptedTaxonomyIds` |
| `POST /api/products/create` | Opgeslagen als `v2Resolved.barterOpenness` | Opgeslagen |
| `PATCH` via `buildMarketplaceV2PatchFields` | Geüpdatet als veld in body | Geüpdatet |
| **`MarketplaceOfferForm` submit** | **Niet in payload** | **Wel in payload** |

---

## 3. Bestaande UI-locaties

### 3.1 Create flow

| Component | Rol | Barter-openness | Accepted values |
|-----------|-----|-----------------|-----------------|
| `MarketplaceEntryFlow` | Intent → category → taxonomy | **Geen stap** | **Geen stap** |
| `MarketplaceOfferForm` | Hoofdformulier na entry | **Geen state, geen UI** | **`AcceptedValuesPicker`** (optioneel) |
| `TaxonomySpecializationPicker` | Aangeboden specialisaties | N.v.t. | N.v.t. |
| `AcceptedValuesPicker` | Multi-select taxonomy | N.v.t. | **Actief** |
| `CategoryFormSelector` | Route naar V2 flow + form | Doorgeeft geen barter | Doorgeeft accepted via `existingProduct` |

**Antwoorden create flow:**

- Kan gebruiker ruilbereidheid instellen? **Nee** — geen aparte keuze, geen impliciete inferentie bij accepted values.
- Is dit zichtbaar als aparte keuze? **Nee**.
- Wordt accepted values opgeslagen? **Ja** (`acceptedSpecializations`).
- Wordt `barterOpenness` meegestuurd? **Nee** (ontbreekt in payload regels 360–387 `MarketplaceOfferForm.tsx`).
- Wordt `barterOpenness` teruggelezen na opslaan? **Niet relevant voor nieuwe listings** — blijft `null` tenzij via andere API-call gezet.

### 3.2 Edit flow

| Pad | Laadt `barterOpenness` | Toont/aanpast | Slaat op |
|-----|------------------------|---------------|----------|
| `app/product/[id]/edit/page.tsx` | **Ja** → `existingProduct.barterOpenness` | Form leest het **niet** | Payload stuurt het **niet** |
| `MarketplaceOfferForm` edit | `acceptedSpecializations` geladen | Alleen accepted picker | PATCH zonder `barterOpenness` |
| Legacy `Compact*Form` | Alleen als `useMarketplaceV2=false` | Geen barter UI | N.v.t. voor dorpsplein V2 |

**Legacy mapping:** Geen aparte mapper voor oude barter-waarden; taxonomy-legacy zit in `legacy-subcategory-map.ts` (specialisaties), **niet** voor `barterOpenness`.

**Create vs edit verschil:** Functioneel **hetzelfde gat** — beide missen barter-openness UI en payload; edit laadt DB-waarde wel in page state maar form negeert die.

### 3.3 Overige UI die barter raakt

| Oppervlak | Gebruik `barterOpenness` |
|-----------|--------------------------|
| Tile price line (`build-tile-price-line.ts`) | **Rendert** `BARTER_ONLY`, `MONEY_AND_BARTER` |
| Preview payment (`build-preview-payment.ts`) | **Rendert** zelfde + secondary copy |
| `ProductAcceptedBadgesSection` | **Niet** — alleen accepted taxonomy + price-based heading |
| `ProductOfferedBadgesSection` | **Niet** — alleen aangeboden specialisaties |
| Exchange suggestions (detail/sidebar/profile) | **Indirect** via DB-waarde op candidates |
| `CreateProposalSheet` | Leest `product.barterOpenness` voor settlement context |

**Geen** `BarterOpennessPicker`, `PaymentBarterSelector`, of vergelijkbare component in `components/products/**`.

---

## 4. Bestaande API/payload dekking

### 4.1 Inkomend (write)

```
POST /api/products/create     → barterOpenness: v2Resolved.barterOpenness (null als niet meegegeven)
PATCH /api/products/[id]      → barterOpenness via buildMarketplaceV2PatchFields (alleen als in body)
```

`parseBarterOpenness` (`lib/marketplace/parse-v2-payload.ts`):

- `null` / `''` → `null` (DB nullable; runtime later `MONEY`)
- `MONEY` | `MONEY_AND_BARTER` | `BARTER_ONLY` → enum
- Overige waarden → `null`

**Validatie:** `validateMarketplacePrice` controleert **niet** op barter-configuratie. `isValidBarterConfiguration` (`exchange-eligibility.ts`) bestaat wel: `BARTER_ONLY` zonder accepted taxonomy → invalid (alleen gebruikt in exchange eligibility, niet in product create API).

### 4.2 Uitgaand (read)

`barterOpenness` wordt meegegeven in o.a.:

- Product fetch API (edit page)
- Discovery read model (`discovery-read-model.ts`, `getDiscoveryBarterOpenness`)
- Feed/tile mappers (`map-to-tile-model.ts`, `map-profile-listing-to-tile-model.ts`)
- Exchange suggestions select (`exchangeSuggestionProductSelect`)
- Search contract (`search-contract.ts` — filterbaar)

### 4.3 Dekkingssamenvatting

| Laag | Dekking |
|------|---------|
| Schema + migratie | **Volledig** |
| Parse/patch API | **Volledig** |
| Form → API | **Gat** — form stuurt veld niet |
| API → UI (edit) | **Gedeeltelijk** — geladen in page, niet in form state |

---

## 5. Bestaande tile/detail dekking

### 5.1 Tiles

| Mechanisme | Status | Details |
|------------|--------|---------|
| `buildTilePriceLine` | **Actief** | `BARTER_ONLY` → “Ruil”; `MONEY_AND_BARTER` → “€X + ruil” |
| `getMarketplacePriceDisplay` | **Actief** | `alternativeValue` als prijs 0 + accepted specs (zonder barter enum) |
| Accepted-value badges | **Actief** | `build-tile-badges.ts` — taxonomy label + Lucide icon (5B-B) |
| `barterSlot` | **Reserved** | `resolveBarterSlot` zet `reserved: true` als openness ≠ `MONEY` **of** accepted values; **niet doorgegeven aan `TileBadgeRow`** |
| `TileBadgeRow` | **Geen barter** | Rendert alleen `badges` + `overflowCount` |

**Overlap risico:** Price line + accepted badge kunnen **dubbele signalen** geven (“€X + ruil” + accepted-value chip). `barterSlot` als extra badge zou **derde** laag worden — nu bewust niet gerenderd (5B-B).

### 5.2 Detailpagina (`app/product/[id]/page.tsx`)

| Sectie | Toont ruilbereidheid? | Toont accepted values? |
|--------|----------------------|------------------------|
| `ProductOfferedBadgesSection` | Nee | Nee (alleen aanbod) |
| `ProductAcceptedBadgesSection` | **Indirect** via heading (`acceptsAlso` / `acceptsOnly` op basis van **prijs**, niet openness) | **Ja** |
| `buildDetailValueExchangeBlock` | **Niet wired** — alleen in validators + `lib/marketplace/detail/index.ts` export | Zou payment + accepted + desired tonen |
| Exchange suggestions modules | Match-UX | Niet openness-label |

**Verkoop vs ruil vs beide:** Niet expliciet als label op detail. Gebruiker ziet hooguit accepted badges + prijs/checkout; geen “Betaling & ruil”-sectie (`marketplace.detail.valueExchange.title` bestaat wel in i18n).

---

## 6. Bestaande matching-dekking

### 6.1 Veldgebruik in matching (4D)

`buildExchangeAcceptanceModel` (`exchange-resolver.ts`):

```ts
const openness = String(input.barterOpenness ?? 'MONEY').toUpperCase();
if (openness === 'MONEY') return null;  // geen acceptance-model
```

- **`barterOpenness` is leidend** voor of een listing exchange-acceptance heeft.
- **`acceptedSpecializations` alleen** → acceptance-model blijft `null` bij default `MONEY`.

`computeExchangeOverlap` (`exchange-overlap.ts`):

- `barterOpenForMatching` → vereist `BARTER_ONLY` of `MONEY_AND_BARTER` voor `mutualBarterReady`.
- Subcategory-overlap (aanbod ↔ gewenst) werkt **ook zonder** openness, maar wederzijdse ruilbereidheid niet.

### 6.2 Exchange suggestions (4F/4G)

`app/api/marketplace/exchange-suggestions/route.ts` — candidate filter:

```ts
OR: [
  { barterOpenness: { in: ['BARTER_ONLY', 'MONEY_AND_BARTER'] } },
  { listingIntent: 'REQUEST' },
]
```

`productRowIsSuggestionEligible`:

- openness ≠ `MONEY` → eligible
- `REQUEST` + `MONEY` → eligible
- `OFFER` + `MONEY` + accepted values **zonder** barter enum → **niet** suggestion-eligible

### 6.3 Scoring / caps / surfaces

- Resolver: `resolveExchangeSuggestions`, caps in `exchange-suggestion-caps.ts`, surfaces in `exchange-suggestion-surface.ts` — profielen via `productRowToExchangeProfile` met `barterOpenness` uit DB.
- Search filter: `matchesBarterOpenness` in `search-listing-filters.ts` — optioneel filter, niet default.

### 6.4 Fallback-gedrag

| Ontbrekend veld | Fallback | Effect |
|-----------------|----------|--------|
| `barterOpenness` null | `MONEY` | Geen acceptance; geen mutual barter; meeste OFFERs uit suggestions |
| `acceptedSpecializations` leeg + `BARTER_ONLY` | `isValidBarterConfiguration` → false | Exchange ineligible |
| Alleen accepted values, openness `MONEY` | Geen inferentie naar `MONEY_AND_BARTER` | **UX/data mismatch** |

**Velden die nu bepalen of iets als exchange-match telt:**

1. `barterOpenness` (primair voor acceptance)
2. `specializations` / offer subcategories
3. `acceptedSpecializations` (alleen als openness barter toestaat)
4. `listingIntent` (REQUEST-pad)
5. `desiredExchanges` (indien aanwezig op profiel)
6. Eligibility: active, discoverable, niet blocked, geldige barter-config

---

## 7. Gaten / ontbrekende schakels

| # | Gap | Ernst | Classificatie |
|---|-----|-------|---------------|
| G1 | Geen barter-openness UI in create/edit | **Kritiek** | Ontbreekt echt (UI) |
| G2 | Form payload mist `barterOpenness` | **Kritiek** | Alleen aansluiten |
| G3 | Accepted values zonder openness → matching uit | **Kritiek** | Product/logica-beslissing nodig |
| G4 | `buildDetailValueExchangeBlock` niet op product page | **Hoog** | Alleen aansluiten |
| G5 | Detail toont geen expliciet verkoop/ruil/beide | **Hoog** | Copy bestaat; component ontbreekt op page |
| G6 | `barterSlot` berekend, niet gerenderd | **Laag** | Bewust reserved (5B-B) |
| G7 | Geen API-validatie barter-config bij save | **Medium** | `BARTER_ONLY` zonder accepted kan opgeslagen worden |
| G8 | `exchangeOpenness` / `tradeOpenness` | N.v.t. | Niet bouwen — gebruik `barterOpenness` |

---

## 8. Dubbelbouw-risico's

| Als we nu bouwen… | Risico | Advies |
|-------------------|--------|--------|
| Nieuw DB-veld `exchangeOpenness` | Duplicaat van `BarterOpenness` | **NIET doen** |
| Tweede accepted-values picker | `AcceptedValuesPicker` bestaat | **Hergebruiken** |
| Aparte badge-rij alleen voor “open voor ruil” | Overlap met price line + accepted badge | Eerst price line + detail block; `barterSlot` alleen als aanvulling |
| Nieuwe matching op alleen accepted values | Botst met 4D openness-gate | **NIET** zonder productbesluit; eventueel inferentie bij save |
| Nieuwe i18n voor geld/ruil | `marketplace.valueExchange.payment.*` + tile keys bestaan | **Hergebruiken** |
| Parallel detail-sectie naast badges | `buildDetailValueExchangeBlock` dekt payment + accepted | **Eén geïntegreerde sectie** i.p.v. tweede accepted-blok |
| Taxonomy-icon badges opnieuw | 5B-B wiring compleet | **NIET opnieuw** |

**Concreet dubbel-UI scenario vandaag:** Gebruiker vult accepted values in → ziet op tile mogelijk `alternativeValue` of accepted badge → denkt “ik ruil” → matching ziet `MONEY` → suggestions tonen listing niet als barter-kandidaat. Extra barter-badge zonder form-fix verergert verwarring.

---

## 9. Aanbevolen volgende fase (5B-D)

Prioriteit **zonder nieuwe velden**:

### 9.1 Must — hergebruik bestaande stack

1. **`MarketplaceOfferForm`:** state + 3-way selector (`MONEY` | `MONEY_AND_BARTER` | `BARTER_ONLY`) met copy uit `PAYMENT_METHOD_REGISTRY` / `marketplace.valueExchange.payment.*`.
2. **Submit payload:** `barterOpenness` meesturen; edit prefill uit `existingProduct.barterOpenness`.
3. **Productregel:** Bij selectie accepted values → default naar `MONEY_AND_BARTER` (of verplichte keuze) — voorkomt G3; afstemmen met `isValidBarterConfiguration`.

### 9.2 Should — display aansluiten

4. **Detail:** `buildDetailValueExchangeBlock` renderen onder hero/acties; titel `marketplace.detail.valueExchange.title` (“Betaling & ruil”).
5. **Accepted badges:** Heading laten of integreren in value-exchange block — **niet** twee identieke taxonomy-lijsten.

### 9.3 Could — tiles

6. **`barterSlot`:** Alleen activeren in `TileBadgeRow` als price line onvoldoende is (bijv. compact variant); anders reserved houden.

### 9.4 Niet in deze fase

- Geen nieuwe enum-waarden
- Geen matching-logica wijzigen (tenzij expliciete inferentie bij save)
- Geen duplicate exchange-suggestion UI

---

## Bijlage A — Onderzoeksvragen (korte antwoorden)

### Datamodel
- Velden: `barterOpenness`, `acceptedSpecializations`; afgeleid `acceptedValueCategories/Subcategories` op tile model.
- Opslag: `Product` in PostgreSQL.
- Geen `exchangeOpenness` / `tradeOpenness`.

### Create flow
- Ruilbereidheid instellen: **nee**.
- Accepted values: **ja**, opgeslagen en naar API.
- `barterOpenness`: **niet** meegestuurd.

### Edit flow
- Geladen in edit page: **ja**; form: **nee**.
- Aanpassen/opslaan: **nee**.
- Legacy barter mapping: **n/a**.

### Tile rendering
- `barterSlot`: **reserved, niet actief in UI**.
- `barterOpenness` in **price line + preview**: **ja**.
- Accepted badges: **ja**, overlap mogelijk met price line.

### Detail
- Ruilbereidheid expliciet: **nee**.
- Accepted values: **ja** (`ProductAcceptedBadgesSection`).
- Verkoop/ruil/beide: **niet duidelijk** zonder value-exchange block.

### Matching
- Gebruikt `barterOpenness`: **ja**, gates acceptance.
- Alleen accepted values: **niet** voor acceptance (default `MONEY`).
- Fallback: **`MONEY`**.

### i18n
- NL/EN keys voor payment/barter/tile/exchange suggestions: **ja** (`marketplace.valueExchange.payment.*`, `marketplace.tile.price.*`, `marketplace.exchangeSuggestions.*`, `marketplace.acceptedValues.*`).
- Geen dedicated key “ruilbereidheid” — wel `mutualReadiness`, `moneyAndBarter`, `barter`.
- Hardcoded NL in product UI rond barter: **niet gevonden** in form components; copy via i18n.

---

## Bijlage B — Validatie (2026-07-07)

Alle checks **geslaagd** (geen feature-code toegevoegd voor deze audit).

| Check | Resultaat |
|-------|-----------|
| `npm run lint` | pass |
| `npm run build` | pass |
| `npx tsx scripts/validate-marketplace-tile-system.ts` | **90/90** |
| `npx tsx scripts/validate-marketplace-taxonomy-consolidation.ts` | **845/845** |
| `npx tsx scripts/validate-exchange-foundation.ts` | **50/50** |
| `npx tsx scripts/validate-value-exchange-system.ts` | **53/53** |
| `npx tsx scripts/validate-exchange-suggestions.ts` | **124/124** |
| `npx tsx scripts/validate-marketplace-detail-system.ts` | **182/182** |

---

## Bijlage C — Belangrijkste bestanden (referentie)

| Domein | Pad |
|--------|-----|
| Schema | `prisma/schema.prisma` |
| API parse/patch | `lib/marketplace/parse-v2-payload.ts`, `lib/marketplace/patch-v2-fields.ts` |
| Create form | `components/products/marketplace/MarketplaceOfferForm.tsx` |
| Accepted picker | `components/products/marketplace/AcceptedValuesPicker.tsx` |
| Tile price/badges | `lib/marketplace/tiles/build-tile-price-line.ts`, `build-tile-badges.ts` |
| Detail block (unwired) | `lib/marketplace/detail/detail-value-exchange-block.ts` |
| Matching | `lib/marketplace/exchange/exchange-resolver.ts`, `exchange-overlap.ts` |
| Suggestions API | `app/api/marketplace/exchange-suggestions/route.ts` |
| Payment registry | `lib/marketplace/value-exchange/payment-methods.ts` |
| i18n | `public/i18n/nl.json`, `public/i18n/en.json` → `marketplace.valueExchange`, `marketplace.detail.valueExchange` |
