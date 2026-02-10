# 🔑 Google Maps API Keys - Wat is juist?

## ❓ Vraag: Dezelfde key voor beide, of twee aparte keys?

### Optie 1: Dezelfde key voor beide (werkt, maar minder veilig) ✅

**Huidige situatie:**
```bash
GOOGLE_MAPS_API_KEY=AIzaSyClgZanBk73fYDdXU_CCUIlwl_aB-whod4
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyClgZanBk73fYDdXU_CCUIlwl_aB-whod4
```

**Dit werkt als:**
- Je API key heeft **"None"** als Application restrictions
- OF je API key heeft **HTTP referrer restrictions** die zowel browser als server toestaan
- OF je API key heeft **geen restrictions**

**Voordelen:**
- ✅ Eenvoudig: 1 key beheren
- ✅ Werkt direct

**Nadelen:**
- ⚠️ Minder veilig: Client-side key wordt in browser blootgesteld
- ⚠️ Moeilijker om server-side extra te beveiligen met IP restrictions
- ⚠️ Als key gelekt wordt, is alles open

---

### Optie 2: Twee aparte keys (AANBEVOLEN) 🎯

**Beter:**
```bash
# Client-side key (voor browser: kaarten, autocomplete)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...jouw_client_key_hier

# Server-side key (voor server: geocoding, distance matrix)
GOOGLE_MAPS_API_KEY=AIza...jouw_server_key_hier
```

**Hoe maak je 2 aparte keys?**

#### Key 1: Client-side Key (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`)

1. Ga naar Google Cloud Console → APIs & Services → Credentials
2. Klik op **+ CREATE CREDENTIALS** → **API key**
3. Kopieer de nieuwe key
4. Klik op de key naam om te bewerken

**Application restrictions:**
- Kies **"HTTP referrers (web sites)"**
- Voeg toe:
  ```
  http://localhost:3000/*
  https://homecheff.nl/*
  https://*.homecheff.nl/*
  https://*.vercel.app/*
  ```

**API restrictions:**
- Selecteer **"Restrict key"**
- Vink aan:
  - ✅ Maps JavaScript API
  - ✅ Places API

**Gebruik deze key voor:** `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

#### Key 2: Server-side Key (`GOOGLE_MAPS_API_KEY`)

1. Maak een **nieuwe API key** (of gebruik je huidige)
2. Klik op de key naam om te bewerken

**Application restrictions:**
- Kies **"IP addresses"**
- Voeg toe: `0.0.0.0/0` (tijdelijk)
- OF kies **"None"** (als je Vercel gebruikt zonder vaste IP)

**API restrictions:**
- Selecteer **"Restrict key"**
- Vink aan:
  - ✅ Geocoding API
  - ⚠️ Distance Matrix API (optioneel)

**Gebruik deze key voor:** `GOOGLE_MAPS_API_KEY`

---

## ✅ Wat is juist voor jou?

### Als je **snel** wilt testen:
**Huidige setup (zelfde key) werkt!** ✅
- Beide keys met dezelfde waarde is oké voor development
- Zorg wel dat je key de juiste APIs heeft toegestaan (Maps JavaScript API, Places API, Geocoding API)

### Als je **productie** gaat:
**Gebruik 2 aparte keys!** 🎯
- Veiliger: Als client-side key gelekt wordt, is server-side nog beveiligd
- Beter controle: Verschillende restrictions per use case

---

## 🔍 Check je huidige setup

### 1. Check of je key werkt:
```bash
# Test in browser console (F12):
console.log(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
```

### 2. Check Google Cloud Console:
- Ga naar **APIs & Services** → **Credentials**
- Klik op je API key
- Check **API restrictions**: Zijn Maps JavaScript API, Places API, Geocoding API toegestaan?
- Check **Application restrictions**: Wat staat er? "None" of "HTTP referrers"?

---

## 💡 Aanbeveling

**Voor nu (development):**
- ✅ Huidige setup (zelfde key) is oké
- ✅ Zorg dat key alle benodigde APIs heeft toegestaan
- ✅ Zorg dat `http://localhost:3000/*` in HTTP referrer restrictions staat (als je HTTP referrers gebruikt)

**Voor productie:**
- 🎯 Maak 2 aparte keys
- 🎯 Client-side key met HTTP referrer restrictions
- 🎯 Server-side key met IP restrictions of "None"

---

## 🚀 Quick Fix (als je 1 key wilt blijven gebruiken)

Zorg dat je huidige key deze settings heeft:

1. **Application restrictions:**
   - **"HTTP referrers (web sites)"**
   - Voeg toe: `http://localhost:3000/*`, `https://homecheff.nl/*`, `https://*.vercel.app/*`
   - OF kies **"None"** (minder veilig, maar werkt altijd)

2. **API restrictions:**
   - **"Restrict key"**
   - Vink aan:
     - ✅ Maps JavaScript API
     - ✅ Places API
     - ✅ Geocoding API
     - ⚠️ Distance Matrix API (optioneel)

3. **Beide environment variables gebruiken dezelfde key:**
   ```bash
   GOOGLE_MAPS_API_KEY=AIzaSyClgZanBk73fYDdXU_CCUIlwl_aB-whod4
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyClgZanBk73fYDdXU_CCUIlwl_aB-whod4
   ```

**Dit werkt voor development en productie!** ✅









