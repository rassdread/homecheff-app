# HomeCheff Local Discovery (Fase 5B)

Lokale geo-fundering voor het dorpsplein — zonder landelijke ontdekking te verliezen.

Gerelateerd: [Delivery Foundation](./HOMECHEFF_DELIVERY_FOUNDATION.md) · [Ecosysteem V3](./HOMECHEFF_ECOSYSTEM_V3.md) · [Feed Taxonomy (5D)](./HOMECHEFF_FEED_TAXONOMY.md)

---

## Locatiebronnen

| Rol | Leidende bron | Fallback | Gebruikt in |
|-----|---------------|----------|-------------|
| **Viewer** | Query `lat`/`lng` → geocoded `place` → `User.lat/lng` | Geen IP-geo | Feed API, GeoFeed |
| **Seller (marketplace)** | `SellerProfile.lat/lng` | `User.lat/lng` | Feed, afstandslabels, delivery matching |
| **Product** | Seller-locatie (geen aparte pickup-kolommen in DB) | — | Feed filtering & ranking |
| **Delivery (bezorger)** | `resolveDelivererPosition()` | home → profile | Delivery APIs (Fase 5A) |
| **Legacy Listing/Dish** | `Listing.lat/lng`, `Dish.lat/lng` | Geen Amsterdam-fallback meer | Feed merge |

Centrale helpers:

- `lib/geo/local-discovery.ts` — radius, feed sort, marketplace coords
- `lib/delivery/delivery-position.ts` — `resolveSellerCoords()`, `resolveDelivererPosition()`
- `lib/geocoding.ts` — `safeDistanceKm()` (null bij ongeldig; geen valse 0 km)

---

## Radius beleid

Gedefinieerd in `lib/geo/local-discovery.ts`:

| Preset | km | Betekenis |
|--------|-----|-----------|
| **LOCAL** | 25 | Standaard feed (GeoFeed + API default) |
| **REGIONAL** | 50 | Bredere buurt/regio |
| **NATIONAL** | 0 | Onbeperkt — landelijke modus |

Client-opties (filter UI): `0, 5, 10, 25, 50, 100` km.

`normalizeFeedRadiusKm(0)` → onbeperkt. Ontbrekende param → `FEED_RADIUS_DEFAULT_KM` (25).

### Radius-modi (GeoFeed + `/api/feed`)

| Modus | Query param | Gedrag |
|-------|-------------|--------|
| **Lokaal eerst** | `radiusMode=local_first` (default) | Items binnen radius eerst; nationale tail vult aan |
| **Alleen in mijn buurt** | `radiusMode=strict_local` | Harde filter: alleen items met geldige `distanceKm ≤ radius`; geen nationale tail; items zonder coords verborgen |

Zonder viewer-locatie valt `strict_local` terug op `local_first` (landelijke discovery).

---

## Feed gedrag

### Zonder viewer-locatie

- Geen bbox-filter op producten
- Recency + follow tie-break
- Landelijke ontdekking (recente items nationwide)
- Edge cache voor anonieme default feed (ongewijzigd)

### Met viewer-locatie + radius > 0 — LOCAL_FIRST

1. **DB prefilter:** producten met seller in bbox **of** zonder seller-coords
2. **Partition:** items binnen radius = **lokaal**; rest = **nationaal**
3. **Sort:** lokaal eerst (score met sterke distance boost), daarna nationale tail (recency)
4. **Afstand:** `distanceKm` alleen bij geldige coords; UI toont nooit `0 km`

Contact-only producten, inspiratie (prijs 0) en items zonder coords blijven in **nationale tail** zichtbaar.

### Met viewer-locatie + radius > 0 — STRICT_LOCAL

1. **DB prefilter:** bbox op `SellerProfile` **of** `User`-fallback; **geen** null-coord bypass
2. **Filter:** alleen items met geldige `distanceKm ≤ radius`
3. **Sort:** score binnen de straal; **geen** nationale tail
4. **GeoFeed client:** respecteert server-volgorde (geen smart re-ranking)

### Dorpsplein (`/api/products`)

Dorpsplein gebruikt een **eigen productpad** (`DorpspleinPageContent` → `/api/products`), niet `/api/feed`.
Default radius daar = **0 (wereldwijd)**; client-side afstandsfilter alleen bij `radius > 0`.
Items zonder locatie blijven zichtbaar (LOCAL_FIRST-gedrag). `radiusMode` geldt nog niet op Dorpsplein.

### Sorteren & client-filters (GeoFeed)

| Filter / sort | API (`/api/feed`) | Client (GeoFeed) |
|---------------|-------------------|------------------|
| `radius`, `radiusMode`, `lat`/`lng`/`place`, `vertical`, `q` | ✅ server | state → `buildGeoFeedApiParams()` |
| `feedChip` (all/sale/inspiration) | — | client partition |
| `searchQuery` (refine) | — | client text match |
| `priceMin` / `priceMax` | — | `matchesFeedClientPriceRange()` |
| `sortBy` / `sortOrder` | — | `sortFeedSaleItems()` |

Gedrag:

- **LOCAL_FIRST + sort = nieuwste (default):** smart score ranking (`rankSalesByScore`) binnen geladen set.
- **STRICT_LOCAL + sort = nieuwste:** server score-volgorde; geen smart re-ranking.
- **sort = afstand / prijs / views:** altijd client `sortFeedSaleItems`; afstand-option alleen zichtbaar met locatie.
- **Prijs op aanvraag** (`CONTACT`, geen `priceCents`): onderaan bij prijssortering; uitgesloten bij numerieke min-prijsfilter.

Helpers: `lib/feed/feed-client-sort.ts`, `lib/feed/feed-query-params.ts`.

### Response cap

Max 30 items na local-first sort (ongewijzigd).

---

## Afstandsberekening

- **Formule:** Haversine, R = 6371 km (`lib/community/geoDistance.ts`)
- **Display:** `formatDistanceLabel()` — null bij onbekend; GeoFeedCards verbergt `<= 0`
- **Legacy:** `calculateDistance()` → 0 bij invalid (alleen oude callers); nieuwe code gebruikt `safeDistanceKm()`

Verwijderd in Fase 5B:

- Amsterdam-fallback op legacy listings in feed API
- Amsterdam/lat fallback in users API

---

## Delivery alignment

Marketplace seller anchor = `resolveSellerCoords()` — zelfde als delivery matching (Fase 5A).

Toekomstige Delivery Requests / Helpers kunnen dezelfde coords + radius policy hergebruiken.

---

## Feed-readiness voor Aanbod en Vraag

Na Fase 5B is de geo/local-first laag **direction-agnostisch**: elk feed-item met geldige coördinaten kan dezelfde pipeline gebruiken (`resolveSellerCoords` / item-anchor, bbox-prefilter, `sortFeedItemsLocalFirst`, `safeDistanceKm`).

### Principes

- **Local-first geo** werkt straks voor alle itemtypes met coördinaten — producten, diensten, vragen en opdrachten.
- **Eén geo-fundering** — geen aparte radius-, afstands- of bbox-logica per categorie of per direction.
- **Viewer-locatie** blijft leidend (GPS, profiel, geocoded plaats); **item-anchor** = seller/profiel-locatie (nu `SellerProfile.lat/lng`).
- **Advanced filters** komen later **dynamisch per direction + category** (zie [Feed Taxonomy in Ecosysteem V3](./HOMECHEFF_ECOSYSTEM_V3.md#feed-taxonomy)); geen hardcoded filtersets per vertical dupliceren.

### Huidige vs. toekomstige feed

| Aspect | Fase 5B | Fase 5D | Later (V3) |
|--------|---------|---------|------------|
| Richting | Vooral Aanbod | Taxonomy-laag (`OFFER` afgeleid) | Aanbod + Vraag |
| Itemtypes | Product, inspiratie, legacy | + optioneel `taxonomy` op API | + TASK, SERVICE, BARTER |
| UI chips | all / sale / inspiration | View filter ≠ item type | + Aanbod, Vraag, … |
| Geo | ✅ gedeeld | ✅ + taxonomy op items | ✅ zelfde laag |

### Niet nu bouwen

Documentatie-only; geen scope in Fase 5B:

- Vraag-feed en request-itemtypes
- Klusjes
- Ruilen
- Assignment model
- Helpers (als apart systeem)

---

## Toekomst

| Fase | Scope |
|------|-------|
| **5B** | Product feed lokaal filteren + local-first ranking |
| **5D** | Feed taxonomy foundation (derive, href, card router) |
| **DeliveryRequest** | Standalone bezorging; zelfde seller/viewer coords |
| **Helpers / Klusjes** | Service-locatie op SellerProfile |
| **Assignments** | Generiek opdracht-model met geo |

Niet gepland in 5B: PostGIS, pickupLat migratie, premium geo.

---

## Bestanden

| Bestand | Rol |
|---------|-----|
| `lib/geo/local-discovery.ts` | Radius config, feed sort, bbox helper |
| `lib/feed/feed-client-sort.ts` | Client sort & price filter |
| `lib/feed/feed-query-params.ts` | GeoFeed → API param mapping |
| `lib/geocoding.ts` | `safeDistanceKm` |
| `app/api/feed/route.ts` | Product bbox, local-first sort |
| `components/feed/feedSaleRanking.ts` | Sterkere distance boost |
| `components/feed/GeoFeedCards.tsx` | Geen 0 km display |
