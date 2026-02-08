# Google Maps Afstandsberekening in Filters - Opties Analyse

## Google Maps Distance Matrix API Pricing (2024)

**Gratis Tier:**
- $200 gratis krediet per maand
- Distance Matrix API: $5 per 1.000 requests
- **Gratis limiet: ~40.000 requests/maand** (binnen $200 krediet)
- Daarna: $5 per 1.000 requests

**Belangrijke limieten:**
- Max 25 origins per request
- Max 25 destinations per request
- Max 100 elements per request (origins × destinations)

---

## OPTIE 1: Batch API Route (Aanbevolen voor schaalbaarheid)

### Functionaliteit
- ✅ **Efficiënt**: 1 API call voor meerdere producten (max 25 tegelijk)
- ✅ **Accuraat**: Route-based afstanden (niet hemelsbreed)
- ✅ **Snel**: Parallel processing mogelijk
- ✅ **Caching**: Resultaten worden gecached (24 uur)
- ✅ **Fallback**: Automatisch naar Haversine bij fouten

### Implementatie
```typescript
// API route: /api/distance/batch
// Berekent afstanden voor max 25 producten tegelijk
// Client stuurt array van product locaties
// Server berekent in batches van 25
```

### Kosten Analyse

**Scenario: 100 producten op pagina**
- Batch 1: 1 API call voor 25 producten = **$0.005** (gratis binnen limiet)
- Batch 2: 1 API call voor 25 producten = **$0.005**
- Batch 3: 1 API call voor 25 producten = **$0.005**
- Batch 4: 1 API call voor 25 producten = **$0.005**
- **Totaal: 4 API calls = $0.02** (gratis binnen limiet)

**Maandelijkse kosten (bijvoorbeeld):**
- 1.000 gebruikers/dag × 3 filter acties = 3.000 requests/dag
- 3.000 × 4 API calls = 12.000 calls/dag
- 12.000 × 30 = **360.000 calls/maand**
- Kosten: (360.000 - 40.000) × $0.005 = **$1.600/maand**

**Met caching:**
- Cache hit rate: ~70% (veel dezelfde routes)
- Nieuwe calls: 108.000/maand
- Kosten: (108.000 - 40.000) × $0.005 = **$340/maand**

### Voordelen
- ✅ Meest kostenefficiënt op schaal
- ✅ Snelle response tijd
- ✅ Goede caching mogelijkheden
- ✅ Schaalbaar tot duizenden producten

### Nadelen
- ⚠️ Complexere implementatie
- ⚠️ Moet API route bouwen
- ⚠️ Loading state nodig tijdens berekening

---

## OPTIE 2: Asynchroon na Filteren (Eenvoudigste)

### Functionaliteit
- ✅ **Eenvoudig**: Geen API route nodig
- ✅ **Direct**: Filter werkt eerst met Haversine
- ✅ **Verbetering**: Google Maps afstanden worden later toegevoegd
- ✅ **Progressive**: Gebruiker ziet eerst resultaten, afstanden worden bijgewerkt

### Implementatie
```typescript
// Client-side:
// 1. Filter eerst met Haversine (instant)
// 2. Toon resultaten
// 3. Bereken Google Maps afstanden async
// 4. Update UI wanneer klaar
```

### Kosten Analyse

**Scenario: 100 producten op pagina**
- 100 individuele API calls = **$0.50** (buiten gratis limiet)
- **Met caching**: ~30 nieuwe calls = **$0.15**

**Maandelijkse kosten:**
- 1.000 gebruikers/dag × 3 filter acties = 3.000 requests/dag
- 3.000 × 30 producten gemiddeld = 90.000 calls/dag
- 90.000 × 30 = **2.700.000 calls/maand** ❌
- Kosten: (2.700.000 - 40.000) × $0.005 = **$13.300/maand** 💸

**Met caching (70% hit rate):**
- Nieuwe calls: 810.000/maand
- Kosten: (810.000 - 40.000) × $0.005 = **$3.850/maand** 💸

### Voordelen
- ✅ Eenvoudigste implementatie
- ✅ Geen server-side code nodig
- ✅ Directe gebruikerservaring (Haversine eerst)

### Nadelen
- ❌ **Zeer duur** op schaal
- ❌ Veel API calls (1 per product)
- ❌ Langzamer (veel requests)
- ❌ Minder efficiënt caching

---

## OPTIE 3: Hybride Aanpak (Beste balans)

### Functionaliteit
- ✅ **Slim**: Haversine voor filtering (instant, gratis)
- ✅ **Accuraat**: Google Maps voor weergave (alleen zichtbare items)
- ✅ **Kostenefficiënt**: Alleen berekenen wat nodig is
- ✅ **Flexibel**: Kan later upgraden naar batch

### Implementatie
```typescript
// 1. Filter met Haversine (instant, gratis)
// 2. Toon resultaten
// 3. Bereken Google Maps alleen voor:
//    - Items op huidige pagina (bijv. 20 items)
//    - Items binnen viewport (lazy loading)
//    - Items die gebruiker bekijkt
```

### Kosten Analyse

**Scenario: 100 producten gefilterd, 20 op pagina**
- Filter: Haversine (gratis) ✅
- Weergave: 20 Google Maps calls = **$0.10** (gratis binnen limiet)

**Maandelijkse kosten:**
- 1.000 gebruikers/dag × 3 filter acties = 3.000 requests/dag
- 3.000 × 20 zichtbare items = 60.000 calls/dag
- 60.000 × 30 = **1.800.000 calls/maand**
- Kosten: (1.800.000 - 40.000) × $0.005 = **$8.800/maand**

**Met caching (70% hit rate):**
- Nieuwe calls: 540.000/maand
- Kosten: (540.000 - 40.000) × $0.005 = **$2.500/maand**

**Met lazy loading (alleen viewport):**
- Alleen items in viewport: ~5 items per pagina
- 3.000 × 5 = 15.000 calls/dag
- 15.000 × 30 = 450.000 calls/maand
- Kosten: (450.000 - 40.000) × $0.005 = **$2.050/maand**

### Voordelen
- ✅ Goede balans tussen kosten en functionaliteit
- ✅ Snelle filtering (Haversine)
- ✅ Accuraat voor weergave
- ✅ Kan later upgraden naar batch

### Nadelen
- ⚠️ Nog steeds duur op grote schaal
- ⚠️ Twee verschillende afstanden (filter vs weergave)

---

## Vergelijking Tabel

| Optie | Maandelijkse Kosten* | Implementatie | Snelheid | Accuraatheid |
|-------|---------------------|---------------|----------|--------------|
| **1. Batch API** | $340 (met cache) | Complex | ⚡⚡⚡ Snel | ✅✅✅ Route-based |
| **2. Async na filter** | $3.850 (met cache) | Eenvoudig | ⚡⚡ Gemiddeld | ✅✅✅ Route-based |
| **3. Hybride** | $2.050 (lazy load) | Medium | ⚡⚡⚡ Snel | ✅✅ Filter: Haversine<br>✅✅✅ Weergave: Route |

*Bij 1.000 gebruikers/dag, 3 filter acties, 70% cache hit rate

---

## Aanbeveling

**Voor jouw situatie (HomeCheff):**

1. **Korte termijn (MVP)**: **Optie 3 (Hybride)**
   - Eenvoudig te implementeren
   - Goede gebruikerservaring
   - Redelijke kosten binnen gratis tier

2. **Lange termijn (Schaal)**: **Optie 1 (Batch API)**
   - Meest kostenefficiënt
   - Beste performance
   - Schaalbaar tot duizenden producten

3. **Vermijd**: **Optie 2 (Async na filter)**
   - Te duur op schaal
   - Inefficiënt gebruik van API

---

## Implementatie Stappen (Optie 1 - Batch API)

1. Maak API route: `/api/distance/batch`
2. Accepteert array van product locaties
3. Berekent in batches van 25
4. Retourneert afstanden met caching
5. Client gebruikt voor filtering en weergave

**Geschatte ontwikkeltijd:** 4-6 uur
**Kostenbesparing:** ~$1.500/maand vs Optie 2






















