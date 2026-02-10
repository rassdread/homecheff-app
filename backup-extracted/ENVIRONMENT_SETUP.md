# Environment Setup - HomeCheff.nl

## 🚀 Snelle Setup

### 1. Lokale Development (.env bestand)

Maak een `.env` bestand in de root van je project met:

```env
# Database
DATABASE_URL=postgresql://username:password@host:port/database
DIRECT_URL=postgresql://username:password@host:port/database

# NextAuth
NEXTAUTH_URL=https://homecheff.nl
NEXTAUTH_SECRET=your-secret-key-here

# Email Service (Resend) - AL GEVULD!
RESEND_API_KEY=re_CUpW6TtM_HcN73wZUPqXvR9h6cQ9fy4vD

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
| `NEXTAUTH_URL` | `https://homecheff.nl` | Production, Preview |
| `RESEND_API_KEY` | `re_CUpW6TtM_HcN73wZUPqXvR9h6cQ9fy4vD` | Production, Preview |
| `NEXTAUTH_SECRET` | `[jouw-secret-key]` | Production, Preview |
| `DATABASE_URL` | `[jouw-database-url]` | Production, Preview |

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

## ✅ Wat is al ingesteld:

- ✅ **Resend API Key** - `re_CUpW6TtM_HcN73wZUPqXvR9h6cQ9fy4vD`
- ✅ **Website URL** - `https://homecheff.nl`
- ✅ **Email Templates** - Professionele HTML emails
- ✅ **Database Schema** - Email verificatie velden toegevoegd
- ✅ **API Endpoints** - Verificatie en resend functionaliteit
- ✅ **UI Pages** - Mooie verificatie pagina

## 🔧 Volgende Stappen:

1. **Voeg je database URL toe** aan de .env file
2. **Genereer een NEXTAUTH_SECRET**:
   ```bash
   openssl rand -base64 32
   ```
3. **Test de registratie flow** lokaal
4. **Deploy naar Vercel** met de environment variabelen

## 📧 Email Testen:

Voor development kun je emails testen naar:
- Je eigen email adres (die je gebruikt voor Resend account)
- Email adressen die je toevoegt in Resend dashboard

**Belangrijk:** Totdat je `homecheff.nl` domein verifieert in Resend, kun je alleen emails versturen naar geverifieerde adressen.

## 🚨 Problemen Oplossen:

### Email komt niet aan:
- Check spam/junk folder
- Verificeer dat RESEND_API_KEY correct is
- Check Resend logs in dashboard

### Login werkt niet:
- Zorg dat email is geverifieerd
- Check database voor `emailVerified` veld
- Test met een nieuw account

### Development server start niet:
- Check of alle environment variabelen zijn ingesteld
- Run `npm install` opnieuw
- Check console voor errors

## 📞 Support:

Voor vragen: support@homecheff.nl








