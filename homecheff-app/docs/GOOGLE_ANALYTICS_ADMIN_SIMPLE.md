# Google Analytics Data in Admin Dashboard - Eenvoudige Setup

## 📊 Snelle Oplossing: Directe Link naar Google Analytics

**Het eenvoudigste:** Voeg een directe link toe naar je Google Analytics dashboard.

```typescript
// In je AnalyticsDashboard component
<a href="https://analytics.google.com/" target="_blank">
  Open Google Analytics Dashboard
</a>
```

## 🎯 Betere Oplossing: Google Analytics Embed

Embed Google Analytics reports direct in je admin dashboard (vereist Google account login).

### Optie 1: Google Analytics Embed Component

Ik heb een `GoogleAnalyticsEmbed` component gemaakt die je kunt toevoegen aan je AnalyticsDashboard.

**Voeg toe aan je AnalyticsDashboard:**

```typescript
import GoogleAnalyticsEmbed from '@/components/admin/GoogleAnalyticsEmbed';

// In je return statement:
<GoogleAnalyticsEmbed measurementId="G-5D0PR6ERQG" />
```

### Optie 2: Directe Embed URL

Voeg een iframe toe met een directe link naar GA4:

```typescript
<iframe
  src="https://analytics.google.com/analytics/web/#/p13277240797/reports/dashboard"
  width="100%"
  height="600"
  frameBorder="0"
/>
```

**Je Stream ID:** `13277240797` (dit zie je in je GA4 stream details)

## 🔐 Authenticatie

⚠️ **Belangrijk:** Google Analytics Embed vereist dat gebruikers zijn ingelogd met een Google account dat toegang heeft tot de GA4 property.

## 📈 Wat je ziet in GA4

- Real-time gebruikers
- Page views
- User segments (buyers, sellers, etc.)
- Traffic sources
- E-commerce metrics
- Custom events (sign_up, login, purchase)

## 🚀 Volledige API Integratie (Geavanceerd)

Voor volledige controle zonder login, heb je nodig:
1. Google Cloud Service Account
2. Google Analytics Data API credentials
3. API endpoint om data op te halen

Zie `GOOGLE_ANALYTICS_ADMIN_DASHBOARD.md` voor volledige setup instructies.

---

**Aanbeveling:** Start met de Embed component - dit is de snelste manier om GA4 data te zien in je dashboard!




