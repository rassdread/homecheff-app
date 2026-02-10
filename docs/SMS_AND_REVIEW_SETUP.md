# SMS & Review Systeem Setup - HomeCheff

## 📋 Overzicht van Benodigde Configuratie

### 1. ✅ Twilio SMS Service (NIEUW)

**Wat je nodig hebt:**
- Twilio Account (gratis trial beschikbaar op [twilio.com](https://www.twilio.com))
- Twilio Account SID
- Twilio Auth Token
- Twilio Phone Number (Nederlandse nummer of internationaal)

**Installatie:**
```bash
npm install twilio
```

**Environment Variabelen (.env.local):**
```env
# Twilio SMS Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+31612345678  # Of je Twilio nummer
```

**Kosten:**
- SMS Provider: ~€0.05 per SMS
- Platform Fee: €0.01 per SMS (20%)
- Totaal: €0.06 per verkoper per bestelling

---

### 2. ✅ Email Service (AL GECONFIGUREERD)

**Resend API** is al ingesteld:
- ✅ `RESEND_API_KEY` - Al aanwezig in project
- ✅ Email templates - Bestaan al
- ✅ Email verificatie - Werkt al

**Geen extra configuratie nodig!**

---

### 3. 🔄 Database Schema Updates (NODIG)

**Voor Review Systeem:**

De `ProductReview` tabel bestaat al, maar we moeten toevoegen:
- `orderId` - Koppeling aan bestelling
- `reviewToken` - Unieke token voor review link (éénmalig)
- `reviewTokenExpires` - Vervaldatum van review link
- `reviewSubmittedAt` - Wanneer review is ingediend

**Migration nodig:**
```prisma
model ProductReview {
  // ... bestaande velden
  orderId              String?  // NIEUW: Koppeling aan bestelling
  orderItemId          String?  // NIEUW: Specifiek order item
  reviewToken          String?  @unique // NIEUW: Unieke token
  reviewTokenExpires   DateTime? // NIEUW: Vervaldatum
  reviewSubmittedAt    DateTime? // NIEUW: Wanneer ingediend
  // ...
}
```

---

### 4. 📧 Review Email Templates (NODIG)

**Nieuwe email templates nodig:**
- Review Request Email (na voltooide bestelling)
- Review Reminder Email (optioneel, na X dagen)

**Template locatie:** `lib/email-templates/review-request.ts`

---

### 5. 🔗 Review Link Systeem (NODIG)

**Functionaliteit:**
- Unieke review token genereren per order/product
- Review link: `/review/[token]`
- Token validatie (éénmalig gebruik)
- Token expiry (bijv. 30 dagen)

**API Endpoints nodig:**
- `POST /api/reviews/create` - Review indienen
- `GET /api/reviews/token/[token]` - Token validatie
- `GET /api/reviews/order/[orderId]` - Reviews voor bestelling

---

### 6. 🎨 Review UI Components (NODIG)

**Nieuwe pagina's/componenten:**
- `/review/[token]` - Review formulier pagina
- `components/reviews/ReviewForm.tsx` - Review formulier
- `components/reviews/ReviewCard.tsx` - Review card met product miniatuur
- `components/reviews/ReviewList.tsx` - Lijst van reviews op profiel
- Profiel pagina uitbreiding voor reviews sectie

---

### 7. 📱 Notificatie Systeem (DEELS KLAAR)

**Al geïmplementeerd:**
- ✅ Buyer notificaties bij bestelling (berichtenbox)
- ✅ Seller notificaties (email, SMS optioneel)

**Nog te implementeren:**
- ⏳ Buyer email bij bestelling
- ⏳ Review request email na voltooide bestelling
- ⏳ Review link in berichtenbox

---

## 🚀 Stap-voor-stap Setup

### Stap 1: Twilio Account Aanmaken
1. Ga naar [twilio.com](https://www.twilio.com)
2. Maak gratis account aan
3. Verifieer je telefoonnummer
4. Ga naar Console → Account → API Keys
5. Kopieer Account SID en Auth Token
6. Ga naar Phone Numbers → Buy a Number
7. Koop een Nederlands nummer (of gebruik trial nummer)

### Stap 2: Environment Variabelen
Voeg toe aan `.env.local`:
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+31612345678
```

### Stap 3: Twilio Package Installeren
```bash
npm install twilio
```

### Stap 4: Database Migration
```bash
# Update schema.prisma met review velden
npx prisma migrate dev --name add_review_tracking
npx prisma generate
```

### Stap 5: Test SMS
```bash
npm run dev
# Test via checkout met SMS optie aangevinkt
```

---

## 📊 Overzicht van Wat Al Werkt

✅ **SMS Functionaliteit:**
- SMS optie in checkout
- SMS kosten berekening
- SMS versturen naar verkopers (als optie gekozen)

✅ **Email Service:**
- Resend API geconfigureerd
- Email templates bestaan
- Email verificatie werkt

✅ **Review Database:**
- ProductReview model bestaat
- Review relaties bestaan

---

## ⚠️ Wat Nog Moet Worden Geïmplementeerd

⏳ **Review Systeem:**
- Review token generatie
- Review link pagina
- Review formulier
- Review weergave op profiel
- Review tracking (éénmalig)

⏳ **Buyer Notificaties:**
- Email bij bestelling
- Review request email
- Review link in berichtenbox

⏳ **UI Components:**
- Review formulier
- Review cards met product miniatuur
- Review lijst op profiel

---

## 💰 Kosten Overzicht

**SMS:**
- €0.06 per verkoper per bestelling
- Alleen als optie gekozen door koper

**Email:**
- Resend gratis plan: 100 emails/dag
- Daarna: €0.002 per email

**Database:**
- Geen extra kosten (binnen bestaande plan)

---

## 🔐 Security Overwegingen

1. **Review Tokens:**
   - Uniek per order/product
   - Crypto-secure random tokens
   - Expiry na 30 dagen
   - Éénmalig gebruik

2. **SMS:**
   - Telefoonnummers worden niet opgeslagen in logs
   - Twilio encryptie in transit

3. **Email:**
   - Resend encryptie
   - Geen gevoelige data in emails

---

## 📝 Checklist

- [ ] Twilio account aangemaakt
- [ ] Twilio API keys toegevoegd aan .env
- [ ] `npm install twilio` uitgevoerd
- [ ] Database migration uitgevoerd (review tracking)
- [ ] Review email templates gemaakt
- [ ] Review link systeem geïmplementeerd
- [ ] Review UI components gemaakt
- [ ] Buyer notificaties geïmplementeerd
- [ ] Test SMS verstuurd
- [ ] Test review flow uitgevoerd

---

## 🆘 Troubleshooting

**SMS werkt niet:**
- Check Twilio credentials in .env
- Check Twilio phone number format (+31...)
- Check Twilio account balance
- Check console logs voor errors

**Email werkt niet:**
- Check RESEND_API_KEY in .env
- Check Resend dashboard voor errors
- Check spam folder

**Review link werkt niet:**
- Check database voor review tokens
- Check token expiry
- Check token uniekheid




