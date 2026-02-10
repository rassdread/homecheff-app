# Google Analytics Data in Admin Dashboard

Om Google Analytics data in je admin dashboard te krijgen, heb je de **Google Analytics Data API** nodig (geen webhook, maar een API om data op te halen).

## 📋 Wat je nodig hebt:

1. **Google Cloud Service Account** (voor server-side API access)
2. **Google Analytics Data API** ingeschakeld
3. **Service Account credentials** (JSON key file)
4. **Service Account toegang** tot je Google Analytics property

## 🔧 Setup Instructies

### Stap 1: Service Account Aanmaken

1. Ga naar [Google Cloud Console](https://console.cloud.google.com/)
2. Selecteer je project (of maak een nieuw project aan)
3. Ga naar **IAM & Admin** → **Service Accounts**
4. Klik op **+ CREATE SERVICE ACCOUNT**
5. Vul in:
   - **Service account name:** `ga4-admin-dashboard`
   - **Service account ID:** `ga4-admin-dashboard` (automatisch gegenereerd)
6. Klik **Create and Continue**
7. Skip **Grant this service account access** (optioneel)
8. Klik **Done**

### Stap 2: Service Account Key Downloaden

1. Klik op de service account die je zojuist hebt aangemaakt
2. Ga naar tab **Keys**
3. Klik **Add Key** → **Create new key**
4. Kies **JSON** format
5. Klik **Create** - de JSON file wordt gedownload

⚠️ **BELANGRIJK:** Bewaar deze JSON file veilig - dit is je service account credentials!

### Stap 3: Google Analytics Data API Inschakelen

1. Ga naar **APIs & Services** → **Library**
2. Zoek naar **"Google Analytics Data API"**
3. Klik op **Enable**

### Stap 4: Service Account Toegang Geven in Google Analytics

1. Ga naar [Google Analytics](https://analytics.google.com/)
2. Ga naar **Admin** (tandwiel icoon links onderaan)
3. Selecteer je property (homecheff)
4. Klik op **Property access management** (onder "Property" kolom)
5. Klik **+** → **Add users**
6. Voeg het service account email toe (bijv: `ga4-admin-dashboard@your-project.iam.gserviceaccount.com`)
7. Geef **Viewer** permissies (of **Analyst** als je meer nodig hebt)
8. Klik **Add**

### Stap 5: Credentials Toevoegen aan Project

Je hebt twee opties:

#### Optie A: JSON File Uploaden (Voor Production)

1. Upload de JSON file naar een veilige locatie (bijv. Vercel Environment Variables als base64)
2. Of gebruik Google Secret Manager

#### Optie B: Environment Variables (Aanbevolen)

1. Open de gedownloade JSON file
2. Kopieer de hele JSON content
3. Voeg toe aan Vercel Environment Variables als `GOOGLE_ANALYTICS_CREDENTIALS` (base64 encoded of als multiline string)

**OF** gebruik individuele velden:

```env
GOOGLE_ANALYTICS_PROJECT_ID=your-project-id
GOOGLE_ANALYTICS_CLIENT_EMAIL=ga4-admin-dashboard@your-project.iam.gserviceaccount.com
GOOGLE_ANALYTICS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## 💡 Alternatief: Eenvoudigere Aanpak (Aanbevolen voor nu)

In plaats van een volledige API integratie, kun je:

1. **Google Analytics Embed API gebruiken** - embed GA4 reports direct in je dashboard
2. **Google Analytics Reporting API via OAuth** - gebruik je persoonlijke Google account
3. **Eenvoudige API met OAuth** - minder setup nodig

## 🚀 Implementatie Opties

### Optie 1: Embed Google Analytics Reports (Eenvoudigst)

Embed GA4 reports direct in je dashboard met iframe of Embed API.

### Optie 2: API Integratie met Service Account (Volledig)

Haal data op via Google Analytics Data API en toon in je eigen dashboard.

### Optie 3: Google Analytics Data API via OAuth (Middenweg)

Gebruik OAuth in plaats van Service Account - minder setup, maar gebruikers moeten inloggen.

## ⚠️ Belangrijk

- **Webhooks zijn niet nodig** - Google Analytics heeft geen webhook systeem
- Je moet **data ophalen** via de API (polling) of **embed reports**
- Voor real-time data gebruik je **GA4 Realtime API**
- Voor historische data gebruik je **GA4 Reporting API**

## 📊 Wat voor data kun je ophalen?

- Page views
- Active users
- Sessions
- Bounce rate
- User demographics
- Traffic sources
- Custom events (sign_up, login, purchase, etc.)
- E-commerce metrics
- User segments (buyer types, seller types, etc.)

---

**Wil je dat ik een van deze opties implementeer? Laat weten welke aanpak je voorkeur heeft!**




