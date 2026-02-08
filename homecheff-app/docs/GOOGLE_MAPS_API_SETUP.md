# 🌍 Google Maps API Setup voor Internationale Geocoding

## 📋 Overzicht

Je hebt **twee verschillende API keys** nodig:
1. **Client-side key** (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`) - voor maps in de browser
2. **Server-side key** (`GOOGLE_MAPS_API_KEY`) - voor geocoding API calls

## 🔧 Stap 1: APIs Inschakelen in Google Cloud Console

1. Ga naar [Google Cloud Console](https://console.cloud.google.com/)
2. Selecteer je project (of maak een nieuw project aan)
3. Ga naar **APIs & Services** → **Library**
4. Zoek en schakel de volgende APIs in:
   - ✅ **Geocoding API** (VERPLICHT voor server-side geocoding)
   - ✅ **Maps JavaScript API** (voor client-side maps)
   - ✅ **Places API** (optioneel, voor autocomplete)
   - ✅ **Distance Matrix API** (optioneel, voor afstand berekenen)
   - ✅ **Routes API** (optioneel, voor route planning)

## 🔑 Stap 2: API Keys Aanmaken

### Option A: Twee Aparte Keys (Aanbevolen)

#### Key 1: Server-side Geocoding API Key

1. Ga naar **APIs & Services** → **Credentials**
2. Klik op **+ CREATE CREDENTIALS** → **API key**
3. Kopieer de key (bijv. `AIza...`)
4. Klik op de key naam om te bewerken

**Application restrictions:**
- Kies **"IP addresses"** 
- Voeg toe: `0.0.0.0/0` (tijdelijk voor testen) OF
- Voeg Vercel IP ranges toe (zie onderaan)
- **OF** kies **"None"** (minder veilig, maar werkt direct)

**API restrictions:**
- Selecteer **"Restrict key"**
- Vink alleen aan:
  - ✅ Geocoding API
- Klik **Save**

5. Gebruik deze key als `GOOGLE_MAPS_API_KEY` in Vercel environment variables

#### Key 2: Client-side Maps API Key

1. Maak een nieuwe API key (zelfde stappen)
2. **Application restrictions:**
   - Kies **"HTTP referrers (web sites)"**
   - Voeg toe:
     - `https://homecheff.nl/*`
     - `https://*.homecheff.nl/*`
     - `http://localhost:3000/*` (voor development)
     - `https://*.vercel.app/*` (voor Vercel previews)

3. **API restrictions:**
   - Selecteer **"Restrict key"**
   - Vink aan:
     - ✅ Maps JavaScript API
     - ✅ Places API (als je autocomplete gebruikt)

4. Gebruik deze key als `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in Vercel

### Option B: Één Key voor Alles (Minder Veilig)

1. Maak één API key
2. **Application restrictions:**
   - Kies **"None"** (werkt voor alles, maar minder veilig)
3. **API restrictions:**
   - Selecteer **"Restrict key"**
   - Vink aan:
     - ✅ Geocoding API
     - ✅ Maps JavaScript API
     - ✅ Places API
4. Gebruik deze key voor BEIDE environment variables

## 🌐 Stap 3: Vercel Environment Variables Instellen

1. Ga naar je Vercel project dashboard
2. Ga naar **Settings** → **Environment Variables**
3. Voeg toe:

```
GOOGLE_MAPS_API_KEY = [je server-side key]
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = [je client-side key]
```

4. Selecteer voor beide:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. Klik **Save**

## ✅ Stap 4: Testen

1. Deploy opnieuw naar Vercel: `vercel --prod`
2. Test met een internationaal adres (bijv. Suriname):
   - Straat: `hoedenpalmstraat`
   - Huisnummer: `13`
   - Plaats: `paramaribo`
   - Land: `Suriname`
3. Klik op "Adres valideren"
4. Het zou moeten werken zonder "referer restrictions" error

## 🔒 Vercel IP Ranges (Voor Productie)

Als je IP restrictions wilt gebruiken voor server-side key, voeg deze toe:

```
76.76.21.21/32
76.223.126.116/32
```

Of gebruik de officiële Vercel IP ranges:
- Check: https://vercel.com/docs/security/deployment-protection#ip-address-allowlist

## ⚠️ Belangrijke Notities

1. **Server-side calls hebben GEEN referer header** - daarom moet je IP restrictions of "None" gebruiken
2. **Client-side calls hebben WEL referer header** - daarom kun je HTTP referrer restrictions gebruiken
3. **Geocoding API werkt wereldwijd** - alle 152 landen worden ondersteund
4. **Nederland gebruikt PDOK** - Google Maps wordt alleen gebruikt voor internationale adressen

## 🐛 Troubleshooting

### Error: "API keys with referer restrictions cannot be used"
- **Oorzaak:** Server-side key heeft HTTP referrer restrictions
- **Oplossing:** Verander naar IP restrictions of "None"

### Error: "This API project is not authorized to use this API"
- **Oorzaak:** Geocoding API is niet ingeschakeld
- **Oplossing:** Schakel Geocoding API in via APIs & Services → Library

### Error: "Adres niet gevonden"
- **Oorzaak:** Adres is onjuist of API key werkt niet
- **Oplossing:** Test eerst met een bekend adres (bijv. "Times Square, New York, US")

## 📚 Meer Informatie

- [Google Maps Geocoding API Docs](https://developers.google.com/maps/documentation/geocoding)
- [API Key Best Practices](https://developers.google.com/maps/api-security-best-practices)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)



