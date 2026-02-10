# Google Maps Kosten Staffel per Aantal Gebruikers

## Aannames per Gebruiker
- **Gemiddeld aantal filter acties per gebruiker per dag**: 3
- **Gemiddeld aantal producten per filter resultaat**: 30
- **Cache hit rate**: 70% (veel dezelfde routes worden opnieuw gebruikt)
- **Gratis tier**: $200/maand = ~40.000 Distance Matrix calls

---

## OPTIE 1: Batch API Route (Aanbevolen)

### Kosten per Maand

| Gebruikers | Filter Acties/Dag | Producten/Dag | API Calls/Dag* | API Calls/Maand | Kosten/Maand |
|------------|-------------------|---------------|----------------|-----------------|--------------|
| **10** | 30 | 900 | 144 | 4.320 | **$0** (gratis) |
| **50** | 150 | 4.500 | 720 | 21.600 | **$0** (gratis) |
| **100** | 300 | 9.000 | 1.440 | 43.200 | **$16** |
| **250** | 750 | 22.500 | 3.600 | 108.000 | **$340** |
| **500** | 1.500 | 45.000 | 7.200 | 216.000 | **$880** |
| **1.000** | 3.000 | 90.000 | 14.400 | 432.000 | **$1.960** |
| **2.500** | 7.500 | 225.000 | 36.000 | 1.080.000 | **$5.200** |
| **5.000** | 15.000 | 450.000 | 72.000 | 2.160.000 | **$10.600** |
| **10.000** | 30.000 | 900.000 | 144.000 | 4.320.000 | **$21.400** |

*Met 70% cache hit rate (30% nieuwe calls)

### Berekening:
- 30 producten = 2 batch calls (25 + 5)
- Met cache: 30% nieuwe = 0.6 calls per filter actie
- Kosten: (API Calls - 40.000) × $0.005

---

## OPTIE 2: Async na Filteren (Niet Aanbevolen)

### Kosten per Maand

| Gebruikers | Filter Acties/Dag | Producten/Dag | API Calls/Dag* | API Calls/Maand | Kosten/Maand |
|------------|-------------------|---------------|----------------|-----------------|--------------|
| **10** | 30 | 900 | 270 | 8.100 | **$0** (gratis) |
| **50** | 150 | 4.500 | 1.350 | 40.500 | **$0** (gratis) |
| **100** | 300 | 9.000 | 2.700 | 81.000 | **$205** |
| **250** | 750 | 22.500 | 6.750 | 202.500 | **$812** |
| **500** | 1.500 | 45.000 | 13.500 | 405.000 | **$1.825** |
| **1.000** | 3.000 | 90.000 | 27.000 | 810.000 | **$3.850** |
| **2.500** | 7.500 | 225.000 | 67.500 | 2.025.000 | **$9.925** |
| **5.000** | 15.000 | 450.000 | 135.000 | 4.050.000 | **$20.050** |
| **10.000** | 30.000 | 900.000 | 270.000 | 8.100.000 | **$40.300** |

*Met 70% cache hit rate (30% nieuwe calls)

### Berekening:
- 30 producten = 30 individuele API calls
- Met cache: 30% nieuwe = 9 calls per filter actie
- Kosten: (API Calls - 40.000) × $0.005

---

## OPTIE 3: Hybride (Haversine Filter + Google Maps Weergave)

### Scenario A: Alle zichtbare items (20 per pagina)

| Gebruikers | Filter Acties/Dag | Zichtbare Items/Dag | API Calls/Dag* | API Calls/Maand | Kosten/Maand |
|------------|-------------------|---------------------|----------------|-----------------|--------------|
| **10** | 30 | 600 | 180 | 5.400 | **$0** (gratis) |
| **50** | 150 | 3.000 | 900 | 27.000 | **$0** (gratis) |
| **100** | 300 | 6.000 | 1.800 | 54.000 | **$70** |
| **250** | 750 | 15.000 | 4.500 | 135.000 | **$475** |
| **500** | 1.500 | 30.000 | 9.000 | 270.000 | **$1.150** |
| **1.000** | 3.000 | 60.000 | 18.000 | 540.000 | **$2.500** |
| **2.500** | 7.500 | 150.000 | 45.000 | 1.350.000 | **$6.550** |
| **5.000** | 15.000 | 300.000 | 90.000 | 2.700.000 | **$13.300** |
| **10.000** | 30.000 | 600.000 | 180.000 | 5.400.000 | **$26.800** |

### Scenario B: Lazy Loading (alleen viewport, ~5 items)

| Gebruikers | Filter Acties/Dag | Viewport Items/Dag | API Calls/Dag* | API Calls/Maand | Kosten/Maand |
|------------|-------------------|-------------------|----------------|-----------------|--------------|
| **10** | 30 | 150 | 45 | 1.350 | **$0** (gratis) |
| **50** | 150 | 750 | 225 | 6.750 | **$0** (gratis) |
| **100** | 300 | 1.500 | 450 | 13.500 | **$0** (gratis) |
| **250** | 750 | 3.750 | 1.125 | 33.750 | **$0** (gratis) |
| **500** | 1.500 | 7.500 | 2.250 | 67.500 | **$138** |
| **1.000** | 3.000 | 15.000 | 4.500 | 135.000 | **$475** |
| **2.500** | 7.500 | 37.500 | 11.250 | 337.500 | **$1.488** |
| **5.000** | 15.000 | 75.000 | 22.500 | 675.000 | **$3.175** |
| **10.000** | 30.000 | 150.000 | 45.000 | 1.350.000 | **$6.550** |

*Met 70% cache hit rate (30% nieuwe calls)

---

## Kosten Vergelijking Tabel

| Gebruikers | Optie 1 (Batch) | Optie 2 (Async) | Optie 3A (20 items) | Optie 3B (Lazy) |
|------------|----------------|-----------------|---------------------|-----------------|
| **10** | $0 | $0 | $0 | $0 |
| **50** | $0 | $0 | $0 | $0 |
| **100** | $16 | $205 | $70 | $0 |
| **250** | $340 | $812 | $475 | $0 |
| **500** | $880 | $1.825 | $1.150 | $138 |
| **1.000** | $1.960 | $3.850 | $2.500 | $475 |
| **2.500** | $5.200 | $9.925 | $6.550 | $1.488 |
| **5.000** | $10.600 | $20.050 | $13.300 | $3.175 |
| **10.000** | $21.400 | $40.300 | $26.800 | $6.550 |

---

## Gratis Tier Limieten

### Wanneer blijf je binnen gratis tier?

**Optie 1 (Batch):**
- ✅ Tot ~250 gebruikers (108.000 calls/maand)
- ✅ Binnen $200 gratis krediet

**Optie 2 (Async):**
- ✅ Tot ~50 gebruikers (40.500 calls/maand)
- ❌ Boven 50 gebruikers wordt duur

**Optie 3A (20 items):**
- ✅ Tot ~250 gebruikers (135.000 calls/maand)
- ⚠️ Net boven gratis tier

**Optie 3B (Lazy loading):**
- ✅ Tot ~500 gebruikers (67.500 calls/maand)
- ✅ Meest kostenefficiënt voor kleine schaal

---

## Aanbevelingen per Schaal

### 0-100 gebruikers
**Aanbevolen: Optie 3B (Lazy Loading)**
- ✅ Volledig gratis
- ✅ Eenvoudige implementatie
- ✅ Goede gebruikerservaring

### 100-500 gebruikers
**Aanbevolen: Optie 1 (Batch API)**
- ✅ Meest kostenefficiënt
- ✅ Schaalbaar
- ✅ Goede performance

### 500-2.500 gebruikers
**Aanbevolen: Optie 1 (Batch API)**
- ✅ Beste prijs/prestatie verhouding
- ✅ ~$1.500/maand besparing vs Optie 2
- ✅ Schaalbaar

### 2.500+ gebruikers
**Aanbevolen: Optie 1 (Batch API) + Caching optimalisatie**
- ✅ Meest kostenefficiënt op grote schaal
- ✅ Overweeg Redis cache voor betere hit rate
- ✅ Monitor API usage

---

## Kostenbesparing Vergelijking

### Optie 1 vs Optie 2 (per maand)

| Gebruikers | Besparing |
|------------|-----------|
| **100** | $189 |
| **250** | $472 |
| **500** | $945 |
| **1.000** | $1.890 |
| **2.500** | $4.725 |
| **5.000** | $9.450 |
| **10.000** | $18.900 |

### Optie 1 vs Optie 3A (per maand)

| Gebruikers | Besparing |
|------------|-----------|
| **100** | $54 |
| **250** | $135 |
| **500** | $270 |
| **1.000** | $540 |
| **2.500** | $1.350 |
| **5.000** | $2.700 |
| **10.000** | $5.400 |

---

## Jaarlijkse Kosten Projectie

### Optie 1 (Batch API)

| Gebruikers | Maandelijks | Jaarlijks |
|------------|-------------|-----------|
| **100** | $16 | $192 |
| **250** | $340 | $4.080 |
| **500** | $880 | $10.560 |
| **1.000** | $1.960 | $23.520 |
| **2.500** | $5.200 | $62.400 |
| **5.000** | $10.600 | $127.200 |
| **10.000** | $21.400 | $256.800 |

### Optie 2 (Async) - Ter vergelijking

| Gebruikers | Maandelijks | Jaarlijks |
|------------|-------------|-----------|
| **100** | $205 | $2.460 |
| **250** | $812 | $9.744 |
| **500** | $1.825 | $21.900 |
| **1.000** | $3.850 | $46.200 |
| **2.500** | $9.925 | $119.100 |
| **5.000** | $20.050 | $240.600 |
| **10.000** | $40.300 | $483.600 |

---

## Conclusie

**Voor HomeCheff:**
- **Start (0-100 gebruikers)**: Optie 3B (Lazy Loading) - **Gratis**
- **Groei (100-500 gebruikers)**: Optie 1 (Batch API) - **$16-$880/maand**
- **Schaal (500+ gebruikers)**: Optie 1 (Batch API) - **Meest kostenefficiënt**

**Jaarlijkse besparing met Optie 1 vs Optie 2:**
- Bij 1.000 gebruikers: **$22.680/jaar**
- Bij 5.000 gebruikers: **$113.400/jaar**
- Bij 10.000 gebruikers: **$226.800/jaar**






















