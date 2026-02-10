# Google Analytics Data API Setup - Uitgebreide Analyse

Voor SPSS-achtige analyse mogelijkheden in je admin dashboard, heb je de **Google Analytics Data API** nodig.

## 📋 Vereisten

1. **Google Cloud Service Account**
2. **Google Analytics Data API** ingeschakeld
3. **Service Account credentials** (JSON)
4. **NPM Package:** `@google-analytics/data`

## 🔧 Stap 1: Service Account Setup

### 1.1 Service Account Aanmaken

1. Ga naar [Google Cloud Console](https://console.cloud.google.com/)
2. Selecteer je project (of maak nieuw aan)
3. Ga naar **IAM & Admin** → **Service Accounts**
4. Klik **+ CREATE SERVICE ACCOUNT**
5. Vul in:
   - **Name:** `ga4-analytics-api`
   - **Description:** `Service account for GA4 Data API access`
6. Klik **Create and Continue**
7. Skip **Grant this service account access** (optioneel)
8. Klik **Done**

### 1.2 Service Account Key Downloaden

1. Klik op de service account die je net hebt gemaakt
2. Ga naar tab **Keys**
3. Klik **Add Key** → **Create new key**
4. Kies **JSON** format
5. Klik **Create** - JSON file wordt gedownload

⚠️ **BELANGRIJK:** Bewaar deze JSON file veilig!

### 1.3 Google Analytics Data API Inschakelen

1. Ga naar **APIs & Services** → **Library**
2. Zoek **"Google Analytics Data API"**
3. Klik **Enable**

### 1.4 Service Account Toegang Geven in GA4

1. Ga naar [Google Analytics](https://analytics.google.com/)
2. Ga naar **Admin** (tandwiel links onder)
3. Selecteer je property (homecheff)
4. Klik op **Property access management** (onder Property kolom)
5. Klik **+** → **Add users**
6. Voeg service account email toe: `ga4-analytics-api@your-project.iam.gserviceaccount.com`
7. Geef **Viewer** permissies
8. Klik **Add**

## 🔑 Stap 2: Credentials Configureren

Je hebt 3 opties voor credentials:

### Optie A: Environment Variables (Aanbevolen)

Voeg toe aan `.env.local` en Vercel:

```env
# Google Analytics Data API
GOOGLE_ANALYTICS_PROJECT_ID=your-project-id
GOOGLE_ANALYTICS_CLIENT_EMAIL=ga4-analytics-api@your-project.iam.gserviceaccount.com
GOOGLE_ANALYTICS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_ANALYTICS_PROPERTY_ID=13277240797
```

**Belangrijk:** 
- `PROJECT_ID` = je Google Cloud project ID
- `CLIENT_EMAIL` = service account email
- `PRIVATE_KEY` = private key uit JSON file (met `\n` voor newlines)
- `PROPERTY_ID` = je GA4 Property ID (Stream ID: 13277240797)

### Optie B: JSON File Base64 Encoded

1. Encode de JSON file naar base64:
   ```bash
   cat service-account-key.json | base64
   ```
2. Voeg toe als environment variable:
   ```env
   GOOGLE_ANALYTICS_CREDENTIALS_BASE64=ewogICJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsCiAg...
   ```

### Optie C: Google Secret Manager (Meest Veilig)

1. Upload JSON naar Google Secret Manager
2. Haal op via Google Secret Manager API

## 📦 Stap 3: NPM Package Installeren

```bash
npm install @google-analytics/data
```

## ✅ Stap 4: Verify Setup

Na setup kun je testen of alles werkt via de API endpoint:
```
GET /api/admin/analytics/ga4?test=true
```

---

## 📊 Functionaliteiten

Na setup heb je toegang tot:

- ✅ **Alle GA4 metrics** (users, sessions, pageviews, etc.)
- ✅ **Custom dimensions** (user_role, buyer_types, seller_types, etc.)
- ✅ **Custom events** (sign_up, login, purchase, etc.)
- ✅ **Geavanceerde filters** (date ranges, dimensions, metrics)
- ✅ **Export naar CSV/Excel**
- ✅ **Cross-tabulations**
- ✅ **Multi-dimensional analysis**
- ✅ **Statistical analysis**
- ✅ **Date range comparisons**

---

**Zal ik nu de volledige implementatie maken?**




