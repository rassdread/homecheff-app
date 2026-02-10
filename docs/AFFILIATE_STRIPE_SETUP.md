# Stripe Setup voor Affiliate Systeem

## ✅ Wat er al is geconfigureerd:

### 1. Basis Stripe Configuratie
- ✅ `STRIPE_SECRET_KEY` - Al geconfigureerd
- ✅ `STRIPE_PUBLISHABLE_KEY` - Al geconfigureerd  
- ✅ `STRIPE_WEBHOOK_SECRET` - Al geconfigureerd
- ✅ `STRIPE_CONNECT_CLIENT_ID` - Al geconfigureerd (voor verkopers)

### 2. Webhook Events (al geïmplementeerd in code)
De volgende events worden al afgehandeld in `app/api/stripe/webhook/route.ts`:
- ✅ `checkout.session.completed` - Voor subscriptions en orders
- ✅ `invoice.paid` - **Voor affiliate commissions** (al geïmplementeerd!)
- ✅ `charge.refunded` - **Voor commission reversals** (al geïmplementeerd!)
- ✅ `charge.dispute.created` - **Voor chargeback reversals** (al geïmplementeerd!)
- ✅ `customer.subscription.deleted` - Voor subscription cancellations

### 3. Stripe Connect (voor affiliate payouts)
- ✅ `createTransfer()` functie bestaat al in `lib/stripe.ts`
- ✅ Affiliates kunnen Stripe Connect accounts aanmaken (via bestaande seller flow)

---

## 🔧 Wat je moet toevoegen in Stripe Dashboard:

### 1. Webhook Events Toevoegen

**Stap 1: Ga naar Stripe Dashboard**
1. Log in op https://dashboard.stripe.com
2. Ga naar **Developers** → **Webhooks**
3. Selecteer je bestaande webhook endpoint (of maak een nieuwe)

**Stap 2: Voeg de volgende events toe:**

Voor het affiliate systeem heb je deze events nodig:

```
✅ invoice.paid              (Al toegevoegd in code, moet in Stripe Dashboard)
✅ charge.refunded            (Al toegevoegd in code, moet in Stripe Dashboard)
✅ charge.dispute.created     (Al toegevoegd in code, moet in Stripe Dashboard)
```

**Hoe toe te voegen:**
1. Klik op je webhook endpoint
2. Scroll naar **"Select events to listen to"**
3. Klik op **"Select events"** of **"Add events"**
4. Zoek en selecteer:
   - `invoice.paid`
   - `charge.refunded` 
   - `charge.dispute.created`
5. Klik op **"Add events"**
6. Sla op

### 2. Stripe Connect voor Affiliates

**Optioneel maar aanbevolen:**
Affiliates kunnen uitbetalingen ontvangen via Stripe Connect. Dit werkt hetzelfde als voor verkopers:

- ✅ Code is al geïmplementeerd
- ✅ Affiliates kunnen `stripeConnectAccountId` hebben in hun User profiel
- ✅ Payouts worden gedaan via `stripe.transfers.create()`

**Geen extra configuratie nodig** - werkt met bestaande Stripe Connect setup!

---

## 📋 Environment Variables Checklist

Controleer of deze variabelen in je `.env.local` staan:

```env
# Basis Stripe (verplicht)
STRIPE_SECRET_KEY=sk_test_... of sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_test_... of pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Connect (voor payouts)
STRIPE_CONNECT_CLIENT_ID=ca_...

# Affiliate Payout Cron (optioneel, voor automatische payouts)
CRON_SECRET=your-secret-key-here
```

---

## 🧪 Testen

### Test 1: Webhook Events
1. Maak een test subscription via `/sell`
2. Check Stripe Dashboard → **Events** → Je zou `invoice.paid` moeten zien
3. Check je logs - je zou moeten zien: `✅ CommissionLedger entry created`

### Test 2: Affiliate Payout
1. Log in als affiliate
2. Ga naar `/affiliate/dashboard`
3. Check of je "Stripe Connect" onboarding kunt starten
4. Na onboarding, test een payout via `/api/affiliate/payouts/process`

### Test 3: Commission Reversal
1. Maak een refund in Stripe Dashboard voor een subscription
2. Check of `charge.refunded` event wordt ontvangen
3. Check database - `CommissionLedger` zou een negatieve entry moeten hebben

---

## ⚠️ Belangrijke Opmerkingen

### 1. Webhook URL
Zorg dat je webhook URL correct is ingesteld:
- **Lokaal (development)**: Gebruik Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- **Productie**: `https://homecheff.nl/api/stripe/webhook` of `https://homecheff.eu/api/stripe/webhook`

### 2. Test vs Live Mode
- **Test mode**: Gebruik `sk_test_...` keys
- **Live mode**: Gebruik `sk_live_...` keys
- Zorg dat webhook events ook in de juiste mode zijn ingesteld!

### 3. Idempotency
De code heeft al idempotency checks ingebouwd:
- ✅ `CommissionLedger` gebruikt `eventId` (invoice.id) als unique identifier
- ✅ Duplicate events worden automatisch genegeerd

---

## 🚀 Quick Start Checklist

- [ ] Webhook events toevoegen in Stripe Dashboard (`invoice.paid`, `charge.refunded`, `charge.dispute.created`)
- [ ] Environment variables controleren (`.env.local`)
- [ ] Test subscription maken en webhook events verifiëren
- [ ] Affiliate account aanmaken en Stripe Connect onboarding testen
- [ ] Payout flow testen (optioneel, kan later)

---

## 📞 Troubleshooting

**Webhook events worden niet ontvangen:**
- Check of webhook URL correct is
- Check of events zijn toegevoegd in Stripe Dashboard
- Check webhook secret in `.env.local`
- Gebruik Stripe CLI voor lokale testing: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

**Commissions worden niet aangemaakt:**
- Check of `BusinessSubscription` een `attributionId` heeft
- Check of `Attribution` record bestaat voor de gebruiker
- Check logs voor errors in `processCommissionForInvoice`

**Payouts werken niet:**
- Check of affiliate een `stripeConnectAccountId` heeft
- Check of Stripe Connect onboarding is voltooid
- Check of `stripeConnectOnboardingCompleted` true is

---

## ✅ Conclusie

**Bijna alles staat er al!** Je hoeft alleen:
1. ✅ **3 webhook events toevoegen** in Stripe Dashboard (`invoice.paid`, `charge.refunded`, `charge.dispute.created`)
2. ✅ **Environment variables controleren** (staan waarschijnlijk al goed)

De rest van de code is al volledig geïmplementeerd en klaar om te gebruiken! 🎉

