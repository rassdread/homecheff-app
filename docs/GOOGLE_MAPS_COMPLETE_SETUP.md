# 🗺️ Complete Google Maps Setup voor HomeCheff

## 📋 Overzicht - Wat heb je nodig?

Je hebt **2 API keys** nodig voor alle functies:

1. **`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`** (client-side) - voor browser functies
2. **`GOOGLE_MAPS_API_KEY`** (server-side) - voor server functies

---

## 🎯 Functies die Google Maps gebruiken:

### 1. **Admin Live Location Map** ✅ (VERPLICHT)
- **Component**: `components/admin/LiveLocationMap.tsx`
- **Gebruikt**: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- **API's nodig**:
  - ✅ Maps JavaScript API
  - ✅ Places API (voor markers/geocoding)

### 2. **Product Map View (Filters)** ⚠️ (OPTIONEEL)
- **Component**: `components/map/ProductMapView.tsx`
- **Gebruikt**: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- **API's nodig**:
  - ✅ Maps JavaScript API
  - ✅ Places API

### 3. **Adres Autocomplete** ✅ (VERPLICHT)
- **Component**: `components/ui/GooglePlacesAutocomplete.tsx`
- **Gebruikt**: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- **API's nodig**:
  - ✅ Maps JavaScript API
  - ✅ Places API (VERPLICHT voor autocomplete!)

### 4. **Server-side Geocoding** ✅ (VERPLICHT)
- **Files**: `lib/global-geocoding.ts`, `app/api/geocoding/global/route.ts`
- **Gebruikt**: `GOOGLE_MAPS_API_KEY`
- **API's nodig**:
  - ✅ Geocoding API

### 5. **Delivery Match Orders (Route Distance)** ⚠️ (OPTIONEEL)
- **Files**: `lib/google-maps-distance.ts`, `app/api/delivery/match-orders/route.ts`
- **Gebruikt**: `GOOGLE_MAPS_API_KEY`
- **API's nodig**:
  - ✅ Distance Matrix API (optioneel - gebruikt Haversine fallback als niet beschikbaar)

---

## 🔧 Stap 1: APIs Inschakelen in Google Cloud Console

1. Ga naar [Google Cloud Console](https://console.cloud.google.com/)
2. Selecteer je project (`homecheff-auth` zoals in screenshot)
3. Ga naar **APIs & Services** → **Library**

### VERPLICHTE APIs (alle functies):
- ✅ **Maps JavaScript API** (voor alle kaarten)
- ✅ **Places API** (voor autocomplete en markers)
- ✅ **Geocoding API** (voor server-side adres validatie)

### OPTIONELE APIs (beter route afstanden):
- ⚠️ **Distance Matrix API** (voor accurate route afstanden voor bezorgers)

**Schakel deze allemaal in!**

---

## 🔑 Stap 2: API Keys Configureren

### Key 1: Client-side Key (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`)

1. Ga naar **APIs & Services** → **Credentials**
2. **Maak een nieuwe API key** (of gebruik bestaande)
3. Klik op de key naam om te bewerken

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

**API restrictions:**
- Selecteer **"Restrict key"**
- Vink aan:
  - ✅ **Maps JavaScript API** (VERPLICHT)
  - ✅ **Places API** (VERPLICHT voor autocomplete!)

4. **Kopieer deze key** en gebruik voor `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

### Key 2: Server-side Key (`GOOGLE_MAPS_API_KEY`)

1. **Maak een nieuwe API key** (of gebruik bestaande)
2. Klik op de key naam om te bewerken

**Application restrictions:**
- Kies **"IP addresses"** 
- Voeg toe: `0.0.0.0/0` (tijdelijk voor testen)
- **OF** kies **"None"** (minder veilig, maar werkt direct)
- **OF** voeg Vercel IP ranges toe (voor productie)

**API restrictions:**
- Selecteer **"Restrict key"**
- Vink aan:
  - ✅ **Geocoding API** (VERPLICHT)
  - ⚠️ **Distance Matrix API** (OPTIONEEL - alleen als je route afstanden wilt)

3. **Kopieer deze key** en gebruik voor `GOOGLE_MAPS_API_KEY`

---

## 📝 Stap 3: Environment Variables Instellen

### Lokaal (`.env.local`):

```bash
# Client-side key (voor browser: kaarten, autocomplete)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...jouw_client_key_hier

# Server-side key (voor server: geocoding, distance matrix)
GOOGLE_MAPS_API_KEY=AIza...jouw_server_key_hier
```

**⚠️ BELANGRIJK**: 
- Gebruik **`.env.local`** (niet `.env`) voor lokale development
- Herstart je dev server na toevoegen/wijzigen: `npm run dev`

### Productie (Vercel):

1. Ga naar je Vercel project dashboard
2. Ga naar **Settings** → **Environment Variables**
3. Voeg beide keys toe:
   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = [je client-side key]
   GOOGLE_MAPS_API_KEY = [je server-side key]
   ```
4. Selecteer voor beide:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. Klik **Save**
6. Deploy opnieuw: `vercel --prod`

---

## ✅ Stap 4: Testen

### Test 1: Admin Live Location Map
1. Ga naar Admin Dashboard → "Live Locations" tab
2. Je zou een kaart moeten zien met bezorger locaties
3. Check browser console (F12) voor errors

### Test 2: Adres Autocomplete
1. Ga naar "Item toevoegen" → "Ander adres opgeven"
2. Typ een adres in het adresveld
3. Je zou **automatisch suggesties** moeten zien tijdens typen

### Test 3: Product Map View (Filters)
1. Ga naar Dorpsplein/Inspiratie
2. Filter op locatie/radius
3. Klik op "Kaart weergave" (als beschikbaar)
4. Je zou producten op kaart moeten zien

### Test 4: Delivery Match Orders
1. Ga naar Bezorger Dashboard
2. Bekijk beschikbare bestellingen
3. Check of route afstanden worden berekend
4. Check server logs voor Distance Matrix API calls

---

## 🔍 Checklist

### Google Cloud Console:
- [ ] Maps JavaScript API ingeschakeld
- [ ] Places API ingeschakeld
- [ ] Geocoding API ingeschakeld
- [ ] Distance Matrix API ingeschakeld (optioneel)
- [ ] Client-side key heeft HTTP referrer restrictions
- [ ] Client-side key heeft Maps JavaScript API toegestaan
- [ ] Client-side key heeft Places API toegestaan
- [ ] Server-side key heeft IP restrictions of "None"
- [ ] Server-side key heeft Geocoding API toegestaan
- [ ] Server-side key heeft Distance Matrix API toegestaan (optioneel)

### Environment Variables:
- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in `.env.local` gezet
- [ ] `GOOGLE_MAPS_API_KEY` in `.env.local` gezet
- [ ] Beide keys in Vercel environment variables gezet
- [ ] Dev server herstart na toevoegen keys

### Functionaliteit:
- [ ] Admin Live Location Map werkt
- [ ] Adres Autocomplete geeft suggesties
- [ ] Product Map View werkt (als gebruikt)
- [ ] Delivery Match Orders berekent routes (als Distance Matrix aan staat)

---

## 🐛 Troubleshooting

### ❌ Admin Live Location Map werkt niet

**Check:**
1. Is `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in `.env.local`?
2. Is Maps JavaScript API ingeschakeld?
3. Heeft de key Maps JavaScript API toegestaan in API restrictions?
4. Check browser console voor errors

### ❌ Adres Autocomplete geeft geen suggesties

**Check:**
1. Is `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in `.env.local`?
2. Is **Places API** ingeschakeld? (VERPLICHT!)
3. Heeft de key **Places API** toegestaan in API restrictions?
4. Heeft de key `http://localhost:3000/*` in Application restrictions?
5. Is dev server herstart na toevoegen key?
6. Check browser console voor "Places API" errors

### ❌ Geocoding werkt niet (server-side)

**Check:**
1. Is `GOOGLE_MAPS_API_KEY` in `.env.local`?
2. Is Geocoding API ingeschakeld?
3. Heeft de key Geocoding API toegestaan in API restrictions?
4. Heeft de key IP restrictions die server IPs blokkeren?
5. Check server logs voor errors

### ❌ Distance Matrix API werkt niet (bezorgers)

**Check:**
1. Is `GOOGLE_MAPS_API_KEY` in `.env.local`?
2. Is **Distance Matrix API** ingeschakeld? (optioneel)
3. Heeft de key Distance Matrix API toegestaan in API restrictions?
4. **Note**: Als Distance Matrix niet werkt, gebruikt het systeem Haversine fallback (minder accuraat)

---

## 💰 Kosten Overzicht

### Gratis Tier (per maand):
- **Maps JavaScript API**: 28,000 map loads
- **Places API**: 1,000 requests (Autocomplete kost per request)
- **Geocoding API**: 40,000 requests
- **Distance Matrix API**: 40,000 elements

### Belangrijk:
- **Places Autocomplete** kost per request (buiten free tier)
- **Distance Matrix API** is optioneel - als het niet beschikbaar is, gebruikt het systeem gratis Haversine fallback
- Monitor je usage in Google Cloud Console → APIs & Services → Dashboard

---

## 🔗 Handige Links

- [Google Cloud Console](https://console.cloud.google.com/)
- [Maps JavaScript API Docs](https://developers.google.com/maps/documentation/javascript)
- [Places API Docs](https://developers.google.com/maps/documentation/places)
- [Geocoding API Docs](https://developers.google.com/maps/documentation/geocoding)
- [Distance Matrix API Docs](https://developers.google.com/maps/documentation/distance-matrix)
- [API Key Best Practices](https://developers.google.com/maps/api-security-best-practices)

---

## 📝 Quick Reference

### Voor alle functies (compleet):
```bash
# .env.local
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...client_key
GOOGLE_MAPS_API_KEY=AIza...server_key
```

### APIs nodig:
- ✅ Maps JavaScript API
- ✅ Places API
- ✅ Geocoding API
- ⚠️ Distance Matrix API (optioneel)

### Voor alleen Admin Live Location + Autocomplete (minimaal):
```bash
# .env.local
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...client_key
GOOGLE_MAPS_API_KEY=AIza...server_key
```

### APIs nodig:
- ✅ Maps JavaScript API
- ✅ Places API
- ✅ Geocoding API

---

**Laatste update**: Check altijd Google Cloud Console voor de nieuwste API status en restrictions!









