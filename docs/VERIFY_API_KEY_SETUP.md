# ✅ Check je "Maps Platform API Key" Setup

## 🎯 Je gebruikt: "Maps Platform API Key" (32 APIs)

### Wat moet je checken in Google Cloud Console:

1. **Klik op "Maps Platform API Key"** om de details te zien

### Check 1: Application Restrictions

**Voor client-side (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`) moet je hebben:**
- ✅ **"HTTP referrers (web sites)"** 
- ✅ Met deze referrers:
  ```
  http://localhost:3000/*
  http://localhost:3001/*
  https://homecheff.nl/*
  https://*.homecheff.nl/*
  https://*.vercel.app/*
  ```

**OF** (minder veilig, maar werkt voor alles):
- ⚠️ **"None"** - Dan werkt het voor zowel client-side als server-side

**❌ Als er "IP addresses" staat:**
- Dit werkt NIET voor client-side (browser)
- Je moet dit aanpassen naar "HTTP referrers" of "None"

### Check 2: API Restrictions

**Moet bevatten (minimaal):**
- ✅ **Maps JavaScript API** (voor kaarten)
- ✅ **Places API** (voor autocomplete) - VERPLICHT!
- ✅ **Geocoding API** (voor server-side validatie)

**Optioneel:**
- ⚠️ **Distance Matrix API** (voor route afstanden)

### Check 3: Is de key geschikt voor beide?

**Als Application restrictions = "None":**
- ✅ Werkt voor client-side (browser)
- ✅ Werkt voor server-side (server)
- ✅ Je kunt dezelfde key gebruiken voor beide in `.env.local`

**Als Application restrictions = "HTTP referrers":**
- ✅ Werkt voor client-side (browser)
- ❌ Werkt NIET voor server-side (server heeft geen HTTP referrer)
- ⚠️ Je hebt dan een aparte server-side key nodig

**Als Application restrictions = "IP addresses":**
- ❌ Werkt NIET voor client-side (browser heeft geen vast IP)
- ✅ Werkt alleen voor server-side

---

## 🔍 Actie: Check je huidige instellingen

1. Ga naar Google Cloud Console → Credentials
2. Klik op **"Maps Platform API Key"**
3. Kijk naar **"Application restrictions"**
4. Kijk naar **"API restrictions"**

**Wat zie je?** Laat me weten wat er staat bij:
- Application restrictions: ???
- API restrictions: Welke APIs staan er?

---

## 💡 Aanbeveling op basis van wat je hebt

### Als Application restrictions = "None":
**✅ Perfect!** Je kunt deze key gebruiken voor beide:
```bash
# .env.local
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=[jouw Maps Platform key]
GOOGLE_MAPS_API_KEY=[jouw Maps Platform key]  #zelfde key
```

### Als Application restrictions = "HTTP referrers":
**⚠️ Je moet een aparte server-side key maken** of restrictions aanpassen:
- Optie A: Maak een nieuwe key voor server-side met "IP addresses" of "None"
- Optie B: Verander "Maps Platform API Key" naar "None" (minder veilig, maar werkt voor alles)

### Als Application restrictions = "IP addresses":
**❌ Dit werkt NIET voor client-side!**
- Je moet een nieuwe key maken voor client-side met "HTTP referrers"
- OF verander "Maps Platform API Key" naar "None"

---

## ✅ Wat moet je nu doen?

1. **Open "Maps Platform API Key"** in Google Cloud Console
2. **Check "Application restrictions"** - wat staat er?
3. **Check "API restrictions"** - staan Maps JavaScript API, Places API, Geocoding API erin?
4. **Laat me weten wat je ziet**, dan help ik je met de juiste configuratie!









