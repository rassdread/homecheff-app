# Environment Setup - HomeCheff.nl

## Snelle Setup

### 1. Lokale Development (`.env` / `.env.local`)

Maak een `.env.local` bestand in de root van je project met:

```env
# Database
DATABASE_URL=postgresql://username:password@host:port/database
DIRECT_URL=postgresql://username:password@host:port/database

# NextAuth
NEXTAUTH_URL=https://homecheff.nl
NEXTAUTH_SECRET=your-secret-key-here

# Email Service (Resend) — never commit real keys
RESEND_API_KEY=re_xxx
# Local/dev real sends are suppressed unless explicitly enabled:
# RESEND_ALLOW_DEV_SEND=1

# Cron (required in Production for email-related crons)
CRON_SECRET=your-cron-secret-here

# Social Login (Optioneel)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_CLIENT_ID=your-facebook-client-id
FACEBOOK_CLIENT_SECRET=your-facebook-client-secret

# Stripe (Optioneel)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### 2. Productie (Vercel)

Ga naar je Vercel dashboard:

1. **Selecteer je project** → HomeCheff
2. **Settings** → **Environment Variables**
3. **Voeg toe:**

| Name | Value | Environment |
|------|-------|-------------|
| `NEXTAUTH_URL` | `https://homecheff.nl` | Production |
| `RESEND_API_KEY` | *(Production-only key from Resend dashboard)* | **Production only** |
| `RESEND_PREVIEW_API_KEY` | *(optional dedicated Preview key)* | Preview |
| `RESEND_ALLOW_PREVIEW_SEND` | `1` only if Preview key is set | Preview |
| `CRON_SECRET` | *(strong random secret)* | Production |
| `NEXTAUTH_SECRET` | `[jouw-secret-key]` | Production, Preview |
| `DATABASE_URL` | `[jouw-database-url]` | Production, Preview |

**Do not** put the Production `RESEND_API_KEY` on Preview. Preview sends are suppressed unless a dedicated `RESEND_PREVIEW_API_KEY` is configured.

### Operator actions required (email isolation)

1. In **Resend**: create a **separate** API key for Preview (or a second sub-account/stream when available).  
2. In **Vercel → Production**: keep only Production `RESEND_API_KEY`; set `CRON_SECRET`.  
3. In **Vercel → Preview**: remove Production `RESEND_API_KEY` (or leave unset). Optionally set `RESEND_PREVIEW_API_KEY` + `RESEND_ALLOW_PREVIEW_SEND=1`.  
4. **Rotate** any Resend key that ever appeared in git-tracked docs/history (deleting from current files does not erase history).  
5. Optional kill-switch under quota pressure: `EMAIL_PAUSE_P2=1` (suppresses welcome/review/admin blast; keeps P0/P1).  
6. Future: move P2/admin marketing to a dedicated Resend stream/account so P0/P1 cannot be starved by broadcasts.

### 3. Testen

```bash
# Herstart development server
npm run dev

# Test registratie
# 1. Ga naar http://localhost:3000/register
# 2. Registreer een test account
# 3. Check je email voor verificatielink
# 4. Klik op link om te verifiëren
# 5. Login met je account
```

## Wat is al ingesteld:

- Resend integration in code (`lib/email.ts`, `lib/email/idempotent-send.ts`)
- Website URL — `https://homecheff.nl`
- Email templates — HTML + plain text where applicable
- Database schema — email verification fields
- API endpoints — verification and resend
- UI pages — verification flow

## Volgende stappen:

1. Voeg je database URL toe aan `.env.local`
2. Genereer een `NEXTAUTH_SECRET`:
   ```bash
   openssl rand -base64 32
   ```
3. Maak/rotates Resend keys in the Resend dashboard (never paste them into git-tracked docs)
4. Deploy naar Vercel met gescheiden Production vs Preview email keys

## Email testen:

Voor development kun je emails testen naar operator-owned adressen alleen, met `RESEND_ALLOW_DEV_SEND=1`.

**Belangrijk:** Totdat je `homecheff.eu` / `homecheff.nl` domein verifieert in Resend, kun je alleen emails versturen naar geverifieerde adressen.

## Problemen oplossen:

### Email komt niet aan:
- Check spam/junk folder
- Verificeer dat `RESEND_API_KEY` correct is in Vercel **Production**
- Check Resend logs in dashboard
- Preview/dev may intentionally suppress sends (see env policy)

### Login werkt niet:
- Zorg dat email is geverifieerd
- Check database voor `emailVerified` veld
- Test met een nieuw account

### Development server start niet:
- Check of alle environment variabelen zijn ingesteld
- Run `npm install` opnieuw
- Check console voor errors

## Support:

Voor vragen: support@homecheff.nl
