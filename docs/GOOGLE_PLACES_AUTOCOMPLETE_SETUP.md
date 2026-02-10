# 🔍 Google Places Autocomplete Setup Checklist

## ✅ Wat je nodig hebt in `.env.local` (voor lokaal testen)

Je hebt **minimaal 1 key nodig** voor Places Autocomplete (client-side):

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=je_google_maps_client_key_hier
```

**Optioneel** (voor server-side geocoding):
```bash
GOOGLE_MAPS_API_KEY=je_google_maps_server_key_hier
```

---

## 🌐 Google Cloud Console Instellingen

### Stap 1: APIs Inschakelen

1. Ga naar [Google Cloud Console](https://console.cloud.google.com/)
2. Selecteer je project
3. Ga naar **APIs & Services** → **Library**
4. Zoek en schakel deze APIs in (VERPLICHT):
   - ✅ **Places API** (VERPLICHT voor autocomplete!)
   - ✅ **Maps JavaScript API** (VERPLICHT voor Places API)
   - ✅ **Geocoding API** (optioneel, voor server-side validatie)

### Stap 2: API Key Maken/Checken

1. Ga naar **APIs & Services** → **Credentials**
2. Zoek je API key die je gebruikt voor `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
3. **Klik op de key naam** om te bewerken

### Stap 3: Application Restrictions Instellen

Voor **client-side key** (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`):

**Application restrictions:**
- Kies **"HTTP referrers (web sites)"**
- Voeg deze referrers toe:
  ```
  http://localhost:3000/*
  http://localhost:3001/*
  https://homecheff.nl/*
  https://*.homecheff.nl/*
  https://*.vercel.app/*
  ```

### Stap 4: API Restrictions Instellen

**API restrictions:**
- Selecteer **"Restrict key"**
- Vink **minimaal** deze aan:
  - ✅ **Places API** (VERPLICHT!)
  - ✅ **Maps JavaScript API** (VERPLICHT!)
  
**Optioneel** (als je ook server-side geocoding gebruikt):
  - ✅ **Geocoding API**

4. Klik **Save**

---

## ⚠️ Belangrijk voor Places Autocomplete

De **Places API moet aan staan** in je Google Cloud project, anders werkt autocomplete **niet**!

Je ziet dan:
- ❌ Geen suggesties tijdens typen
- ❌ Console error: "Places API is not enabled"
- ❌ Fallback naar handmatig invullen

---

## 🧪 Testen Lokaal

1. **Zet je key in `.env.local`**:
   ```bash
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...jouw_key_hier
   ```

2. **Herstart je dev server**:
   ```bash
   npm run dev
   ```
   ⚠️ **BELANGRIJK**: Herstart na het toevoegen/wijzigen van env variables!

3. **Test in de browser**:
   - Ga naar "Item toevoegen" → "Ander adres opgeven"
   - Typ een adres in het adresveld
   - Je zou **automatisch suggesties** moeten zien

4. **Check de browser console** (F12):
   - Als je een error ziet over "Places API", check je API restrictions
   - Als je een error ziet over "referrer restrictions", check je Application restrictions

---

## 🔍 Troubleshooting

### ❌ Probleem: Geen suggesties tijdens typen

**Mogelijke oorzaken:**
1. **Places API niet ingeschakeld** in Google Cloud Console
   - ✅ Oplossing: Schakel Places API in via APIs & Services → Library

2. **Places API niet toegestaan in API restrictions**
   - ✅ Oplossing: Voeg Places API toe aan API restrictions van je key

3. **HTTP referrer restrictions blokkeren localhost**
   - ✅ Oplossing: Voeg `http://localhost:3000/*` toe aan Application restrictions

4. **Key niet geladen in browser**
   - ✅ Oplossing: Check `.env.local` bestaat en herstart dev server
   - ✅ Check: `process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in browser console

### ❌ Probleem: "This API project is not authorized to use this API"

**Oorzaak:** Places API is niet ingeschakeld of niet toegestaan voor deze key

**Oplossing:**
1. Ga naar Google Cloud Console → APIs & Services → Library
2. Zoek "Places API"
3. Klik op "Enable" als het nog niet aan staat
4. Check je API key restrictions → API restrictions → Zorg dat Places API aangevinkt is

### ❌ Probleem: "Referer restrictions" error

**Oorzaak:** Application restrictions blokkeren de request

**Oplossing:**
1. Ga naar je API key instellingen
2. Check Application restrictions
3. Zorg dat `http://localhost:3000/*` (en je productie domain) in de lijst staan

---

## 📋 Snelle Checklist

- [ ] Places API ingeschakeld in Google Cloud Console
- [ ] Maps JavaScript API ingeschakeld
- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in `.env.local` gezet
- [ ] API key heeft Places API toegestaan in API restrictions
- [ ] API key heeft `http://localhost:3000/*` in Application restrictions
- [ ] Dev server herstart na toevoegen key
- [ ] Test gedaan: typ adres → zie suggesties ✅

---

## 💡 Tips

1. **Gebruik `.env.local`** (niet `.env`) voor lokale development - wordt niet gecommit
2. **Herstart altijd** je dev server na het toevoegen/wijzigen van env variables
3. **Check de browser console** (F12) voor errors - daar zie je wat er mis gaat
4. **Test eerst met een bekend adres** (bijv. "Damrak 1, Amsterdam") om te zien of het werkt

---

## 🔗 Handige Links

- [Google Places API Documentation](https://developers.google.com/maps/documentation/places/web-service)
- [Maps JavaScript API with Places Library](https://developers.google.com/maps/documentation/javascript/places-autocomplete)
- [API Key Restrictions Best Practices](https://developers.google.com/maps/api-security-best-practices)









