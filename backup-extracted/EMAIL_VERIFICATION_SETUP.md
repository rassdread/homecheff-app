# Email Verificatie Setup - HomeCheff

## Overzicht

Email verificatie is nu volledig geïmplementeerd in HomeCheff. Gebruikers moeten hun email adres verifiëren voordat ze kunnen inloggen.

## Features

✅ **Verificatie Email** - Professionele HTML emails met verificatielink
✅ **24-uurs Tokens** - Verificatielinks zijn 24 uur geldig
✅ **Opnieuw Verzenden** - Gebruikers kunnen verificatie emails opnieuw aanvragen
✅ **Welkom Email** - Automatische welkomstmail na verificatie
✅ **Login Blokkering** - Ongecontroleerde gebruikers kunnen niet inloggen
✅ **Mooie UI** - Professionele verificatie pagina

## Setup Instructies

### 1. Resend API Key Aanmaken

1. Ga naar [Resend.com](https://resend.com)
2. Maak een account aan (gratis plan: 100 emails/dag)
3. Ga naar API Keys
4. Maak een nieuwe API key aan
5. Kopieer de key (begint met `re_`)

### 2. Environment Variabelen

Voeg toe aan je `.env` bestand:

```env
RESEND_API_KEY=re_your_api_key_here
NEXTAUTH_URL=https://homecheff.nl
```

Voor lokale development:
```env
RESEND_API_KEY=re_your_api_key_here
NEXTAUTH_URL=http://localhost:3000
```

### 3. Email Domein Verificatie (Productie)

Voor productie moet je een geverifieerd domein gebruiken:

1. Ga naar Resend dashboard → Domains
2. Voeg `homecheff.nl` toe
3. Voeg de DNS records toe (SPF, DKIM, DMARC)
4. Wacht op verificatie (kan tot 48 uur duren)

**Belangrijk:** Totdat het domein is geverifieerd, kun je alleen emails versturen naar geverifieerde email adressen in je Resend account.

### 4. Database Migratie

De database is al bijgewerkt met de volgende velden:
- `emailVerificationToken` - Token voor verificatie
- `emailVerificationExpires` - Vervaldatum van token

Om de Prisma client te regenereren:
```bash
npx prisma generate
```

**Windows Note:** Als je een EPERM error krijgt, sluit alle Node.js processen en probeer opnieuw.

### 5. Development Server Herstarten

Na het toevoegen van de RESEND_API_KEY:
```bash
npm run dev
```

## Gebruikersflow

### Registratie Flow

1. **Gebruiker registreert** → Account wordt aangemaakt
2. **Verificatie email** → Automatisch verzonden naar gebruiker
3. **Email controle** → Gebruiker klikt op link in email
4. **Verificatie** → Email wordt geverifieerd
5. **Welkom email** → Automatisch verzonden
6. **Redirect** → Gebruiker wordt doorgestuurd naar homepage

### Login Flow

1. **Gebruiker probeert in te loggen**
2. **Email check** → Systeem controleert of email is geverifieerd
3. **Geblockeerd** → Als niet geverifieerd: foutmelding
4. **Toegestaan** → Als geverifieerd: login succesvol

## API Endpoints

### POST /api/auth/verify-email
Verifieert een email adres met token.

**Body:**
```json
{
  "token": "verification_token_here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "E-mailadres succesvol geverifieerd!",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "User Name",
    "emailVerified": "2025-01-18T10:00:00.000Z"
  }
}
```

### POST /api/auth/resend-verification
Verstuurt verificatie email opnieuw.

**Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verificatie-e-mail is opnieuw verzonden."
}
```

## Email Templates

### Verificatie Email
- **From:** HomeCheff <noreply@homecheff.nl>
- **Subject:** Bevestig je e-mailadres - HomeCheff
- **Bevat:** Verificatielink, instructies, support informatie
- **Design:** Modern, responsive HTML email

### Welkom Email
- **From:** HomeCheff <noreply@homecheff.nl>
- **Subject:** Welkom bij HomeCheff! Je account is geactiveerd 🎉
- **Bevat:** Welkomstboodschap, platform features, call-to-action
- **Design:** Modern, responsive HTML email

## Pagina's

### /verify-email
Verificatie pagina waar gebruikers naartoe worden gestuurd:
- Na registratie (zonder token)
- Via email link (met token)
- Voor opnieuw verzenden van verificatie email

**Features:**
- Auto-verificatie bij token in URL
- Email input voor opnieuw verzenden
- Status feedback (loading, success, error)
- Automatische redirect na succesvolle verificatie

## Testing

### Lokaal Testen

1. Registreer een nieuw account
2. Check console logs voor verificatielink
3. Of check je email inbox
4. Klik op de verificatielink
5. Login met je nieuwe account

### Productie Testen

1. Zorg dat RESEND_API_KEY is ingesteld in Vercel
2. Zorg dat NEXTAUTH_URL correct is ingesteld
3. Test de volledige registratie flow
4. Check emails in je inbox

## Troubleshooting

### Email komt niet aan
- Check spam/junk folder
- Verificeer dat RESEND_API_KEY correct is
- Check Resend logs in dashboard
- Verificeer dat domein is geverifieerd (productie)

### Token verlopen
- Tokens zijn 24 uur geldig
- Gebruiker kan nieuwe verificatie email aanvragen
- Check `emailVerificationExpires` in database

### Login geblokkeerd
- Check of `emailVerified` field is ingevuld in database
- Gebruiker moet email eerst verifiëren
- Toon duidelijke foutmelding met instructies

### Prisma Client Errors
- Run `npx prisma generate` om client te regenereren
- Herstart development server
- Check of schema correct is

## Security

✅ **Token Security** - 32-byte random hex tokens
✅ **Expiration** - Tokens verlopen na 24 uur
✅ **One-time Use** - Token wordt verwijderd na gebruik
✅ **Rate Limiting** - Overwegend voor opnieuw verzenden
✅ **Email Verification** - Verplicht voor inloggen

## Kosten

**Resend Pricing:**
- Free Plan: 100 emails/dag, 3,000 emails/maand
- Pro Plan: $20/maand voor 50,000 emails

Voor HomeCheff is de free plan voldoende voor development en early stage.

## Support

Voor vragen of problemen:
- Email: support@homecheff.nl
- Check Resend dashboard voor logs
- Check server logs voor errors

## Toekomstige Verbeteringen

- [ ] Rate limiting voor opnieuw verzenden
- [ ] Email verificatie reminder na X dagen
- [ ] Email change verificatie flow
- [ ] SMS verificatie optie
- [ ] 2FA implementatie
