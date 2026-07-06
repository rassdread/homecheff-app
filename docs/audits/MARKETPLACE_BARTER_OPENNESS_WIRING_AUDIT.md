# Marketplace Phase 5B-D — Barter Openness Wiring Audit

**Datum:** 2026-07-07  
**Voorganger:** `MARKETPLACE_BARTER_OPENNESS_EXISTING_COVERAGE_AUDIT.md`  
**Scope:** Aansluiten bestaande barter/exchange-fundering in forms en detail — geen nieuwe enums, geen matching-redesign.

---

## 1. Wat al bestond

| Laag | Status vóór 5B-D |
|------|------------------|
| Prisma `Product.barterOpenness` | Enum `MONEY` \| `MONEY_AND_BARTER` \| `BARTER_ONLY`, nullable |
| `parseMarketplaceV2FromBody` / `buildMarketplaceV2PatchFields` | Parse en patch van `barterOpenness` |
| `PAYMENT_METHOD_REGISTRY` | Labels + emoji voor de drie barter-modi |
| `buildDetailValueExchangeBlock` | Detail-plan builder (niet op product page) |
| `AcceptedValuesPicker` | Multi-select accepted taxonomy |
| Exchange matching 4D + suggestions 4F/4G | Gebruik `barterOpenness`; default `MONEY` bij null |
| Tile price line | Rendert `BARTER_ONLY` / `MONEY_AND_BARTER` |
| `barterSlot` | Reserved in `buildTileBadges`, niet gerenderd |

**Productie-gat:** `MarketplaceOfferForm` stuurde `barterOpenness` niet mee → DB null → runtime `MONEY` → matching negeerde accepted values.

---

## 2. Welke aansluitingen zijn gemaakt

### Forms

| Bestand | Wijziging |
|---------|-----------|
| `components/products/marketplace/BarterOpennessSelector.tsx` | **Nieuw** — 3-way keuze via `BARTER_OPENNESS_VALUES` + `PAYMENT_METHOD_REGISTRY` labels |
| `components/products/marketplace/MarketplaceOfferForm.tsx` | State, selector UI, edit prefill, submit payload, accepted-values sync |
| `lib/marketplace/resolve-barter-openness-for-save.ts` | **Nieuw** — prefill, save, suggest-after-accepted-values helpers |

`MarketplaceEntryFlow` ongewijzigd — barter-keuze hoort bij offer-form (na entry), niet in intent/category-stappen.

### Detail

| Bestand | Wijziging |
|---------|-----------|
| `components/product/detail/ProductValueExchangeSection.tsx` | **Nieuw** — rendert `buildDetailValueExchangeBlock` |
| `app/product/[id]/page.tsx` | Vervangt `ProductAcceptedBadgesSection` door één value-exchange sectie |

### i18n

| Key | Doel |
|-----|------|
| `marketplace.barterOpenness.hint` | Form hint (NL/EN) |
| `marketplace.errors.barterAcceptedRequired` | Validatie `BARTER_ONLY` zonder accepted |
| Bestaand | `marketplace.detail.valueExchange.title`, `marketplace.valueExchange.payment.*` |

---

## 3. Payloads aangepast

### Create (`POST /api/products/create`)

```json
{
  "barterOpenness": "MONEY" | "MONEY_AND_BARTER" | "BARTER_ONLY",
  "acceptedSpecializations": ["create.meal", ...]
}
```

Backend ongewijzigd — `parseMarketplaceV2FromBody` en create route ondersteunden dit al.

### Edit (`PATCH /api/products/[id]`)

Zelfde veld via `buildMarketplaceV2PatchFields`. Edit page laadde `barterOpenness` al in `existingProduct`; form leest en bewaart het nu.

### Republish / draft

Geen apart republish-pad buiten `MarketplaceOfferForm` + `CategoryFormSelector` (dorpsplein V2). Draft-restore via edit page dekt hetzelfde formulier.

---

## 4. Detailpagina-wijzigingen

**Vóór:** `ProductAcceptedBadgesSection` (alleen accepted taxonomy chips, heading op basis van prijs).

**Na:** `ProductValueExchangeSection`:

- Titel: `marketplace.detail.valueExchange.title` (“Betaling & ruil”)
- Payment-regel via registry (emoji + label)
- Accepted subcategories als chips (één lijst, geen duplicate badges)

**Zichtbaarheid:** Sectie alleen wanneer `barterOpenness !== MONEY` **of** accepted values aanwezig — pure geld-only listings zonder accepted values tonen geen extra blok (zelfde gedrag als voorheen lege accepted-sectie).

`ProductOfferedBadgesSection` blijft voor aangeboden specialisaties.

---

## 5. Productregel accepted values (Opdracht 4)

**Gekozen optie:** Combinatie van **UI-suggestie** + **edit prefill** (niet submit-time override van expliciete `MONEY`).

| Scenario | Gedrag |
|----------|--------|
| Edit: DB `null` + accepted values | Prefill → `MONEY_AND_BARTER` |
| Create: gebruiker voegt accepted values toe | Auto-suggest `MONEY_AND_BARTER` als keuze nog `MONEY` was |
| Expliciet `MONEY` + accepted values | Toegestaan (bewuste keuze); matching blijft MONEY-only |
| `BARTER_ONLY` zonder accepted | Form validatie blokkeert opslaan |

**Waarom geen submit-time force naar `MONEY_AND_BARTER`:** Voorkomt stille overschrijving van expliciete “alleen geld”-keuze. De audit-voorkeur (“onbreekt → infer”) wordt gedekt via prefill (null = ontbreekt) en UI-suggestie bij eerste accepted selectie.

**Bestaande listings:** Geen migratie. Listings met `null` + accepted values tonen op edit `MONEY_AND_BARTER` in form; na opslaan wordt waarde expliciet opgeslagen.

---

## 6. Hoe matching nu profiteert

1. Nieuwe/gewijzigde listings sturen expliciet `barterOpenness` → DB niet meer stil `null` voor actieve gebruikers.
2. `buildExchangeAcceptanceModel` krijgt echte waarden → `MONEY_AND_BARTER` / `BARTER_ONLY` listings krijgen acceptance-model.
3. Exchange suggestions candidate filter (`BARTER_ONLY` \| `MONEY_AND_BARTER` \| `REQUEST`) pakt listings na save op.
4. Geen wijzigingen in scoring, caps of surface rules.

**Verificatie:** `scripts/validate-marketplace-barter-openness-wiring.ts` asserteert acceptance-model voor `MONEY_AND_BARTER` + accepted.

---

## 7. Tile controle (Opdracht 6)

Geen wijzigingen aan:

- `build-tile-price-line.ts`
- `build-tile-badges.ts` / `barterSlot`

`BARTER_ONLY` en `MONEY_AND_BARTER` blijven via price line zichtbaar zodra DB-waarde gezet is.

---

## 8. Resterende beperkingen

| # | Beperking |
|---|-----------|
| R1 | Legacy listings met `null` + accepted values matchen pas na edit/save (geen backfill-migratie) |
| R2 | Expliciet `MONEY` + accepted values: accepted zichtbaar op detail, matching nog steeds zonder acceptance |
| R3 | `barterSlot` op tiles blijft reserved (bewust, 5B-B) |
| R4 | `buildDetailValueExchangeBlock` category-lines (`accepted_category`) niet apart gerenderd — subcategory chips volstaan |
| R5 | Desired exchanges (REQUEST) nog niet in form; detail block ondersteunt ze wel |

---

## 9. Validatie

| Script | Resultaat |
|--------|-----------|
| `npm run lint` | pass |
| `npm run build` | pass |
| `validate-marketplace-tile-system.ts` | 90/90 |
| `validate-marketplace-taxonomy-consolidation.ts` | 845/845 |
| `validate-exchange-foundation.ts` | 50/50 |
| `validate-value-exchange-system.ts` | 53/53 |
| `validate-exchange-suggestions.ts` | 124/124 |
| `validate-marketplace-detail-system.ts` | 182/182 |
| `validate-marketplace-barter-openness-wiring.ts` | **18/18** |

---

## 10. Bestanden gewijzigd / toegevoegd

**Nieuw**

- `lib/marketplace/resolve-barter-openness-for-save.ts`
- `components/products/marketplace/BarterOpennessSelector.tsx`
- `components/product/detail/ProductValueExchangeSection.tsx`
- `scripts/validate-marketplace-barter-openness-wiring.ts`

**Gewijzigd**

- `components/products/marketplace/MarketplaceOfferForm.tsx`
- `app/product/[id]/page.tsx`
- `lib/marketplace/i18n-keys.ts`
- `public/i18n/nl.json`, `public/i18n/en.json`

**Niet gewijzigd (bewust)**

- Prisma schema / migraties
- Exchange resolver / suggestions scoring
- Tile badge / price line rendering
- API route handlers (al compatible)
