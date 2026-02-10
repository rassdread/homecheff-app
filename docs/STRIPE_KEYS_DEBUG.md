# Stripe Keys Debug Guide

## Probleem: Test keys worden nog steeds getoond na deployment

Als je live keys hebt ingesteld in Vercel maar de app nog steeds test mode toont, controleer het volgende:

### 1. Check Environment Variables in Vercel

1. Ga naar **Vercel Dashboard** → je project → **Settings** → **Environment Variables**
2. Controleer dat de volgende variabelen zijn ingesteld:
   - `STRIPE_SECRET_KEY` - moet beginnen met `sk_live_` (niet `sk_test_`)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - moet beginnen met `pk_live_` (niet `pk_test_`)
   - `STRIPE_WEBHOOK_SECRET` - webhook secret voor live mode
   - `STRIPE_CONNECT_CLIENT_ID` - Connect client ID voor live mode

3. **BELANGRIJK**: Zorg dat de variabelen zijn ingesteld voor **Production** environment:
   - Klik op elke variabele
   - Controleer dat "Production" is aangevinkt
   - Preview en Development kunnen verschillende waarden hebben

### 2. Check via Debug Endpoint

Na deployment, ga naar:
```
https://jouw-domein.nl/api/admin/stripe-status
```

Dit toont:
- Welke keys daadwerkelijk worden geladen
- Of ze test of live zijn
- De prefix van elke key

### 3. Mogelijke Oorzaken

#### A. Environment Variables niet voor Production ingesteld
- **Oplossing**: Zet in Vercel de environment variables voor "Production" aan

#### B. Oude build cache
- **Oplossing**: 
  1. Ga naar Vercel Dashboard → Deployments
  2. Klik op de 3 dots → "Redeploy"
  3. Of gebruik: `vercel --prod --force`

#### C. Verkeerde environment variables
- **Oplossing**: Controleer dat je de **live** keys hebt gekopieerd (niet test keys)

#### D. Build gebruikt oude variabelen
- **Oplossing**: 
  1. Verwijder `.next` folder lokaal
  2. Build opnieuw: `npm run build`
  3. Deploy: `vercel --prod`

### 4. Verificatie Stappen

1. **Check in Vercel Dashboard**:
   - Settings → Environment Variables
   - Zorg dat alle keys beginnen met `sk_live_` en `pk_live_`

2. **Check via API**:
   - Ga naar `/api/admin/stripe-status` (als admin ingelogd)
   - Controleer `detectedMode` - moet `"live"` zijn

3. **Check in Admin Panel**:
   - Ga naar Admin → Instellingen
   - Controleer dat "LIVE MODE" wordt getoond (niet "TEST MODE")

### 5. Als het nog steeds niet werkt

1. **Force redeploy**:
   ```bash
   vercel --prod --force
   ```

2. **Check logs**:
   ```bash
   vercel logs --follow
   ```

3. **Verwijder cache**:
   - In Vercel Dashboard → Settings → Build & Development Settings
   - Zet "Clear Build Cache" aan
   - Redeploy

### 6. Environment Variables Checklist

- [ ] `STRIPE_SECRET_KEY` begint met `sk_live_`
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` begint met `pk_live_`
- [ ] Beide zijn ingesteld voor **Production** environment
- [ ] Geen whitespace voor/na de keys
- [ ] Keys zijn volledig gekopieerd (geen ... of truncation)





