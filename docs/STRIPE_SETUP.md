# Stripe Setup Instructies

## Environment Variabelen Instellen

Maak een `.env.local` bestand in de root directory met de volgende variabelen:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
STRIPE_CONNECT_CLIENT_ID=ca_your_connect_client_id_here

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/homecheff"
```

## Stripe Account Setup

1. **Maak een Stripe account aan** op https://stripe.com
2. **Ga naar de Dashboard** en kopieer je API keys:
   - **Publishable key** (pk_test_...) → `STRIPE_PUBLISHABLE_KEY`
   - **Secret key** (sk_test_...) → `STRIPE_SECRET_KEY`

3. **Configureer Webhooks**:
   - Ga naar Developers > Webhooks
   - Voeg endpoint toe: `https://yourdomain.com/api/stripe/webhook`
   - Selecteer events: `checkout.session.completed`, `payment_intent.succeeded`
   - Kopieer webhook secret → `STRIPE_WEBHOOK_SECRET`

4. **Stripe Connect Setup** (voor verkopers):
   - Ga naar Connect > Settings
   - Kopieer Client ID → `STRIPE_CONNECT_CLIENT_ID`

## Test Modus

De app werkt momenteel in test modus. Dit betekent:
- ✅ Geen echte betalingen worden verwerkt
- ✅ Test data wordt gebruikt
- ✅ Mock responses voor development

## Productie Setup

Voor productie:
1. Vervang test keys door live keys
2. Update `NEXTAUTH_URL` naar je productie domain
3. Configureer productie webhooks
4. Test alle betaling flows

## Troubleshooting

**Error: "Stripe is not configured"**
- Controleer of `.env.local` bestaat
- Controleer of `STRIPE_SECRET_KEY` is ingesteld
- Herstart de development server

**Error: "Invalid API key"**
- Controleer of de API key correct is gekopieerd
- Zorg dat je de juiste key gebruikt (test vs live)

**Webhook errors**
- Controleer of webhook URL correct is
- Controleer of webhook secret overeenkomt
- Test webhook in Stripe dashboard





