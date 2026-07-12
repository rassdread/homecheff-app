# HomeCheff Performance Phase 3A-Fix — Restore Images & Single Feed Fetch

**Datum:** 2026-07-12  
**Branch:** `performance/phase2-baseline` (lokaal, **niet gecommit**)  
**Baseline commit:** `49c4454` (Phase 3A preview)  
**Scope:** functionele regressies uit 3A-preview herstellen; veilige 3A-optimalisaties behouden

---

## 1. Gemeten regressies (preview, vóór fix)

| Metriek | Vóór 3A | Na 3A | Δ |
|---------|---------|-------|---|
| geoFeedMounts | 1 | 1 | — |
| feedFetches | **1** | **2** | +1 |
| feed-fetch | 7.092 ms | 8.016 ms | +924 ms |
| first-tile | 7.364 ms | 8.296 ms | +932 ms |
| shell-to-usable | 8.213 ms | 9.140 ms | +927 ms |
| LCP | 3.844 ms | 6.511 ms | +2.667 ms |

**Functioneel:** meerdere feedtegels zonder afbeelding terwijl linked Dish-media vóór 3A wel zichtbaar was.

---

## 2. Oorzaak ontbrekende afbeeldingen

### Mechanisme

Phase 3A introduceerde cross-source deduplicatie en een lichte Dish-query met `id notIn linkedProductIds`:

1. **Linked Product↔Dish** delen hetzelfde UUID (`lib/items/sync-linked-product-dish.ts`).
2. Stripe-passing products worden in `linkedProductIds` gezet.
3. Volledige `Dish.findMany` haalt linked dishes **niet** meer op (`notIn`).
4. `deduplicateCrossSourceFeedItems` laat **PRODUCT winnen** over DISH.
5. Veel Product-records hebben lege `Image[]` terwijl het gekoppelde Dish `photos[]` wél gevuld is.
6. Het winnende PRODUCT-record verliest daardoor bruikbare media; discovery `coverImage` en client `pickPrimaryImageUrl` blijven leeg.

### Fix

| Laag | Wijziging |
|------|-----------|
| **DB** | Parallelle lightweight query `linkedDishMediaRows`: `id in linkedProductIds`, alleen `photos` + `videos` (geen user/includes). |
| **Transform** | `mergeLinkedFeedItemMedia(base, linkedDishMediaToFeedFields(row))` vóór dedup op elk Product. |
| **Dedup** | `deduplicateCrossSourceFeedItems` vult ontbrekende media van gedropte DISH/LISTING in op de winnaar (zelfde UUID = bewezen dual-write). |

**Mergebeleid (geïmplementeerd):**

- PRODUCT `image`/`images` leeg + DISH media aanwezig → vul van DISH
- PRODUCT video ontbreekt + DISH video aanwezig → vul alleen video-velden
- title, prijs, seller, taxonomy blijven op PRODUCT
- geen merge bij verschillende ids (ook niet bij gelijke titel)

---

## 3. Oorzaak dubbele feedfetch

### Trace

Beide requests: **`GET /api/feed?`** met **identieke query parameters** (zelfde `scope`, `radius`, `take`, `skip`, locatie).

**Initiator:** `GeoFeed.tsx` hoofd-`useEffect` (initial fetch, ~regel 1680).

**Keten:**

1. Eerste fetch start met `coordsForApiLabels` / filterstate.
2. Response bevat `filters.lat/lng` → `setApiViewerCoords(viewerFromApi)`.
3. `effectiveViewerForDistance` wijzigt (afgeleid van `apiViewerCoords`).
4. Effect-deps bevatten `effectiveViewerForDistance?.lat/lng` — **niet** gebruikt in `buildGeoFeedApiParams`.
5. Effect draait opnieuw → tweede fetch met dezelfde URL.

Dit is geen SWR, geen Strict Mode double-mount (geoFeedMounts=1), geen filterwijziging, geen cache-miss retry.

### Fix

| Wijziging | Doel |
|-----------|------|
| `effectiveViewerForDistance?.lat/lng` uit effect-deps verwijderd | voorkomt spurious re-run na API-viewer feedback |
| `feedRequestKeyInFlightRef` | voorkomt overlappende duplicate concurrent fetch voor dezelfde `requestKey` |
| Fresh cache hit cleared `inFlight` + early return | cache restore zonder netwerk |

**Behouden:** load-more via aparte `loadMoreFeed` callback; filter/scope-wijzigingen triggeren nog steeds refetch; stale cache → background refresh.

---

## 4. Gewijzigde bestanden

| Bestand | Wijziging |
|---------|-----------|
| `lib/feed/feed-candidate-window.ts` | `mergeLinkedFeedItemMedia`, `linkedDishMediaToFeedFields`, dedup merge |
| `app/api/feed/route.ts` | linked dish media query + product transform merge |
| `components/feed/GeoFeed.tsx` | single-fetch deps fix + in-flight guard |
| `scripts/validate-feed-contract-phase3a.ts` | media-merge + single-fetch static guards |
| `docs/audits/homecheff-performance-phase3a-fix.md` | dit document |
| `docs/audits/homecheff-performance-phase3a-fix-before-after.md` | verwachting before/after |

---

## 5. Phase 3A — behouden vs aangepast

### Behouden (veilig / bewezen)

- Trust `orderItem.groupBy` (`fetch-seller-trust-snapshots.ts`)
- `productReview.aggregate` (`compute-user-public-stats.ts`)
- Extra timing buckets + discovery sub-buckets (`feed-api-timing.ts`)
- DB caps: Product 60, Listing 35, Dish 30
- `Product || Listing` parallel, daarna Dish
- `linkedProductIds` alleen van stripe-passing products
- `computeEnrichmentPoolCap` voor paginatie
- `statsPreview` na `pageItems` (zichtbare sellers)
- Cross-source dedup PRODUCT > LISTING > DISH

### Aangepast (niet volledig teruggedraaid)

- **`notIn linkedProductIds`** blijft → **aanvulling** via lightweight linked-dish media query
- **Dedup** blijft → **media-merge** op winnaar
- **GeoFeed effect-deps** — risicovolle dependency verwijderd

### Niet teruggedraaid

Geen volledige revert van 3A-querypad; regressies waren lokaal te herstellen zonder zware Dish-query terug te brengen.

---

## 6. Performance (Deel 3 — geen hermeting in deze sessie)

**Verwachting na fix (lokaal/preview opnieuw meten):**

| Aspect | Verwachting |
|--------|-------------|
| feedFetches | 1 (was 2) |
| feed-fetch / first-tile / LCP | verbetering door −1 round-trip; geen harde ms-claim zonder hermeting |
| Server route | +1 kleine `Dish` select (`in linkedProductIds`, alleen media) — veel lichter dan volledige Dish include |
| Volledige Dish-query | blijft kleiner door `notIn` |

**Server-pad vs pre-3A:**

- Pre-3A: parallel Product + Listing + Dish (zwaar, dubbele linked dishes)
- 3A: Product‖Listing → Dish `notIn` → minder dish-rows, maar media-gap
- 3A-Fix: zelfde + **lichte media-select** voor linked ids (extra batch, minimaal select)

---

## 7. Validatie

Uitgevoerd:

| Check | Resultaat |
|-------|-----------|
| `npm run lint` | pass |
| `npm run build` | pass |
| `npx tsx scripts/validate-feed-performance-baseline-phase13k.ts` | 23/23 pass (live probe skipped) |
| `npx tsx scripts/validate-feed-contract-phase3a.ts` | 46/46 pass |

Geen database-migraties. Geen env-wijzigingen.

**Visueel:** na fix moeten tegels waar linked Dish `photos` heeft en Product `Image[]` leeg is opnieuw een cover tonen.

---

## 8. Git status

**Geen commit. Geen push.** Wijzigingen alleen lokaal op de werktree.
