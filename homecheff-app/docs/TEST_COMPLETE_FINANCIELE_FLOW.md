# 💰 Complete Financiële Flow Test - Stap voor Stap

## 🎯 Wat gaan we testen?

1. ✅ **Verkoper flow**: Product maken → Stripe onboarding → Verkopen
2. ✅ **Koper flow**: Product kopen → Betalen → Order ontvangen
3. ✅ **Platform fees**: 7-15% correct berekend en verdeeld
4. ✅ **Bezorger flow**: Order accepteren → Bezorgen → Betaling ontvangen
5. ✅ **Uitbetalingen**: Verkoper + Bezorger krijgen correct bedrag

---

## 📋 Voorbereiding (Eenmalig)

### **1. Stripe Test Mode Setup**

**Belangrijk**: We gebruiken ALTIJD test mode!

1. Login op https://dashboard.stripe.com/test
2. Ga naar **Developers** → **API Keys**
3. Kopieer je test keys (deze heb je al in `.env`):
   ```
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

4. Ga naar **Developers** → **Webhooks**
5. Als je lokaal test, installeer Stripe CLI:
   ```bash
   # Windows (via Scoop)
   scoop install stripe
   
   # Of download van: https://stripe.com/docs/stripe-cli
   ```

6. Forward webhooks naar lokale server:
   ```bash
   stripe listen --forward-to localhost:3001/api/stripe/webhook
   ```
   Dit geeft je een **webhook signing secret** → voeg toe aan `.env`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### **2. Test Accounts Aanmaken**

Je hebt 3 soorten accounts nodig:

| Type | Email | Rol | Doel |
|------|-------|-----|------|
| **Verkoper** | `verkoper@test.nl` | SELLER | Producten verkopen |
| **Koper** | `koper@test.nl` | USER | Producten kopen |
| **Bezorger** | `bezorger@test.nl` | DELIVERER | Orders bezorgen |

### **3. Database Check Script Draaien**

```bash
node scripts/test-verkoop-flow.js
```

Dit laat zien wat je al hebt en wat nog moet.

---

## 🧪 Test Flow - Stap voor Stap

### **FASE 1: Verkoper Setup (15 min)**

#### **Stap 1.1: Verkoper Account Maken**
```bash
# Start de app
npm run dev
```

1. ✅ Open browser: http://localhost:3001
2. ✅ Klik "Registreren"
3. ✅ Email: `verkoper@test.nl`
4. ✅ Wachtwoord: `Test1234!`
5. ✅ Username: `testverkoper`
6. ✅ Vul profiel in

#### **Stap 1.2: Stripe Connect Onboarding**

1. ✅ Ga naar `/verkoper/dashboard` of `/seller/dashboard`
2. ✅ Klik "Stripe Connect Instellen" of "Setup Payments"
3. ✅ Je wordt doorgestuurd naar Stripe
4. ✅ Vul **TEST** gegevens in:
   - **Business Type**: Individual
   - **Country**: Netherlands
   - **First Name**: Test
   - **Last Name**: Verkoper
   - **DOB**: 01/01/1990 (moet 18+ zijn!)
   - **Email**: verkoper@test.nl
   - **Phone**: +31612345678
   - **Address**: Teststraat 1, 1234AB Amsterdam
   - **Bank Account**: 
     - IBAN: `NL91ABNA0417164300` (test IBAN)
     - Account Holder: Test Verkoper

5. ✅ Voltooi onboarding
6. ✅ Je wordt teruggestuurd naar HomeCheff
7. ✅ Check: "Stripe Connected" badge zichtbaar?

#### **Stap 1.3: Product Toevoegen**

1. ✅ Ga naar `/sell/new` of "Nieuw Product"
2. ✅ Vul in:
   - **Categorie**: CHEFF
   - **Titel**: "Test Lasagne"
   - **Beschrijving**: "Heerlijke test lasagne"
   - **Prijs**: €15.00
   - **Eenheid**: PORTION
   - **Voorraad**: 10
   - **Bezorgopties**: BOTH (Afhalen + Bezorgen)
3. ✅ Upload foto (of skip)
4. ✅ Klik "Publiceren"
5. ✅ Product is nu zichtbaar in de feed!

**Expected Result:**
```
✅ Product aangemaakt
✅ Status: ACTIVE
✅ Zichtbaar op homepage
```

---

### **FASE 2: Koper Flow (10 min)**

#### **Stap 2.1: Koper Account Maken**

1. ✅ Open **NIEUWE browser** (of incognito)
2. ✅ Ga naar http://localhost:3001
3. ✅ Registreer:
   - Email: `koper@test.nl`
   - Password: `Test1234!`
   - Username: `testkoper`

#### **Stap 2.2: Product Kopen**

1. ✅ Zoek "Test Lasagne" in de feed
2. ✅ Klik op product
3. ✅ Selecteer aantal: 2
4. ✅ Kies bezorgoptie: "Bezorgen" (om bezorger te testen)
5. ✅ Klik "Toevoegen aan Winkelwagen"
6. ✅ Ga naar Winkelwagen (icoon rechtsboven)
7. ✅ Klik "Naar Checkout"

#### **Stap 2.3: Checkout & Betaling**

1. ✅ Vul bezorgadres in:
   - Adres: Koopstraat 1
   - Postcode: 1234AB
   - Stad: Amsterdam
2. ✅ Selecteer bezorgdatum
3. ✅ Klik "Doorgaan naar Betaling"
4. ✅ Je wordt doorgestuurd naar Stripe Checkout
5. ✅ Vul **TEST CARD** in:
   ```
   Card Number: 4242 4242 4242 4242
   Expiry: 12/34
   CVC: 123
   Name: Test Koper
   ```
6. ✅ Klik "Betalen"

**Expected Result:**
```
✅ Betaling succesvol
✅ Order confirmation page
✅ Email ontvangen (check console logs)
✅ Order status: PAID
```

#### **Stap 2.4: Verify Order in Database**

```bash
node scripts/test-verkoop-flow.js
```

Check output:
```
Order 1:
  - Status: PAID ✅
  - Totaal: €30.00 (2x €15.00)
  - Platform Fee (10%): €3.00
  - Verkoper krijgt: €27.00
  - Bezorger krijgt: TBD (na bezorging)
```

---

### **FASE 3: Bezorger Flow (10 min)**

#### **Stap 3.1: Bezorger Account Maken**

1. ✅ Open **NIEUWE browser** (of incognito #2)
2. ✅ Ga naar http://localhost:3001/delivery/signup
3. ✅ Registreer als bezorger:
   - Email: `bezorger@test.nl`
   - Password: `Test1234!`
   - Username: `testbezorger`
   - **Leeftijd**: 18+ (belangrijk!)
   - Vervoer: Fiets
   - Max afstand: 10 km
   - Werkgebied: Amsterdam centrum
   - Beschikbaarheid: Ma-Zo, Hele dag

4. ✅ Voltooi bezorger profiel
5. ✅ Upload ID verificatie (test: random foto)
6. ✅ Wacht op admin goedkeuring (of approve jezelf als admin)

#### **Stap 3.2: Order Accepteren**

1. ✅ Login als bezorger
2. ✅ Ga naar `/delivery/dashboard`
3. ✅ Je ziet de nieuwe order in "Beschikbare Orders"
4. ✅ Klik "Accepteren"
5. ✅ Order status: ACCEPTED_BY_DELIVERER

#### **Stap 3.3: Order Bezorgen**

1. ✅ Klik "Start Bezorging"
2. ✅ Order status: IN_TRANSIT
3. ✅ (Simuleer bezorging - 5 min wachten of...)
4. ✅ Klik "Bezorging Voltooid"
5. ✅ Order status: DELIVERED

**Expected Result:**
```
✅ Order status: DELIVERED
✅ Bezorger krijgt betaling (€5.00 bijv.)
✅ Verkoper krijgt bevestiging
✅ Koper krijgt notificatie
```

---

### **FASE 4: Financiële Verificatie**

#### **Check 1: Platform Fee Berekening**

```bash
node scripts/test-verkoop-flow.js
```

Verwachte output:
```
Order Item:
  - Product: Test Lasagne
  - Aantal: 2
  - Prijs per stuk: €15.00
  - Subtotaal: €30.00
  - Platform Fee (10%): €3.00 ✅
  - Verkoper krijgt: €27.00 ✅
```

#### **Check 2: Stripe Dashboard**

1. ✅ Ga naar https://dashboard.stripe.com/test/payments
2. ✅ Zie je payment van €30.00?
3. ✅ Status: succeeded?
4. ✅ Ga naar **Connect** → **Accounts**
5. ✅ Zie je verkoper account?
6. ✅ Zie je pending transfer van €27.00?

#### **Check 3: Payout Status**

```sql
-- Run in Prisma Studio of psql
SELECT 
  p.id,
  u.email as verkoper,
  p.amountCents / 100.0 as bedrag_euro,
  p.status,
  p.stripeTransferId
FROM "Payout" p
JOIN "User" u ON p.sellerId = u.id
ORDER BY p.createdAt DESC
LIMIT 5;
```

Verwacht:
```
Payout:
  - Verkoper: verkoper@test.nl
  - Bedrag: €27.00 ✅
  - Status: PENDING/PAID
  - Stripe Transfer ID: tr_xxx
```

#### **Check 4: Bezorger Betaling**

```sql
SELECT 
  do.id,
  do.delivererPaymentCents / 100.0 as bezorger_verdient,
  do.status,
  u.email as bezorger
FROM "DeliveryOrder" do
JOIN "DeliveryProfile" dp ON do.delivererProfileId = dp.id
JOIN "User" u ON dp.userId = u.id
ORDER BY do.createdAt DESC
LIMIT 5;
```

Verwacht:
```
Delivery Order:
  - Bezorger: bezorger@test.nl
  - Verdient: €5.00 ✅
  - Status: DELIVERED
```

---

## 📊 Complete Financiële Breakdown

### **Voorbeeld Order: €30.00**

```
💰 Totale Betaling: €30.00
├── 🏪 Platform Fee (10%): €3.00
├── 🚴 Bezorger: €5.00
└── 👨‍🍳 Verkoper: €22.00
    ✅ TOTAAL CHECKS: €30.00
```

### **Formules:**

```javascript
// Platform Fee
platformFee = orderTotal * (platformFeeBps / 10000)
// Bij 10%: €30.00 * 0.10 = €3.00

// Bezorger betaling
delivererFee = FIXED_RATE + (distance * RATE_PER_KM)
// Bijv: €3.00 + (2km * €1.00) = €5.00

// Verkoper krijgt
sellerPayout = orderTotal - platformFee - delivererFee
// €30.00 - €3.00 - €5.00 = €22.00
```

---

## 🐛 Troubleshooting

### **Probleem 1: Stripe Webhook Niet Ontvangen**

**Symptoom**: Order blijft op PENDING staan

**Oplossing**:
```bash
# Check of webhook listener draait
stripe listen --forward-to localhost:3001/api/stripe/webhook

# Test webhook handmatig
stripe trigger checkout.session.completed
```

### **Probleem 2: Platform Fee Niet Berekend**

**Check**:
```javascript
// In OrderItem moet staan:
platformFeeBps: 1000 // = 10%
```

**Verify**:
```sql
SELECT platformFeeBps FROM "OrderItem" WHERE id = 'YOUR_ID';
```

### **Probleem 3: Verkoper Krijgt Geen Payout**

**Check**:
1. ✅ Stripe onboarding compleet?
2. ✅ Order status = PAID?
3. ✅ Webhook afgevuurd?
4. ✅ Check server logs voor errors

### **Probleem 4: Bezorger Niet Gematched**

**Check**:
```javascript
// Bezorger moet binnen radius zijn
const distance = calculateDistance(
  order.deliveryLat, 
  order.deliveryLng,
  deliverer.homeLat,
  deliverer.homeLng
);

// distance <= deliverer.maxDistance
```

---

## ✅ Complete Test Checklist

### **Pre-Test:**
- [ ] Stripe test mode actief
- [ ] Webhook listener draait
- [ ] Database clean/backup
- [ ] 3 test accounts klaar

### **Verkoper Flow:**
- [ ] Account aangemaakt
- [ ] Stripe onboarding voltooid
- [ ] Product toegevoegd
- [ ] Product zichtbaar in feed

### **Koper Flow:**
- [ ] Account aangemaakt
- [ ] Product gevonden
- [ ] Checkout succesvol
- [ ] Betaling succesvol (4242...)
- [ ] Order confirmation

### **Bezorger Flow:**
- [ ] Account aangemaakt
- [ ] Profiel goedgekeurd
- [ ] Order geaccepteerd
- [ ] Order bezorgd

### **Financieel:**
- [ ] Platform fee correct (10%)
- [ ] Verkoper payout correct
- [ ] Bezorger payment correct
- [ ] Stripe dashboard matches
- [ ] Database consistent

---

## 🚀 Quick Test (5 minuten)

Als je snel wilt testen:

```bash
# 1. Start app + webhook
npm run dev &
stripe listen --forward-to localhost:3001/api/stripe/webhook &

# 2. Run test script
node scripts/test-verkoop-flow.js

# 3. Als je al accounts hebt:
# - Login als verkoper → check dashboard
# - Maak product
# - Login als koper → koop product (4242...)
# - Check: node scripts/test-verkoop-flow.js

# 4. Verify in Stripe
# Open: https://dashboard.stripe.com/test/payments
```

---

## 📞 Hulp Nodig?

**Check deze logs:**
```bash
# Server logs
npm run dev

# Webhook logs  
stripe listen --forward-to localhost:3001/api/stripe/webhook

# Database
npm run prisma studio
```

**Common Issues:**
- Webhook secret verkeerd → herstart met nieuwe secret
- Stripe onboarding niet compleet → voltooi in dashboard
- Order blijft PENDING → check webhook logs

---

## 📝 Test Resultaten Template

```markdown
## Test Run - [Datum]

### ✅ Geslaagd:
- Verkoper flow compleet
- Koper flow compleet
- Betaling succesvol
- Platform fee correct: €3.00 (10%)
- Verkoper payout: €27.00

### ⚠️ Issues:
- Bezorger matching: 2 seconden te traag
- Email notificatie: niet verzonden

### 📊 Metrics:
- Order tijd: 2:30 min
- Betaling tijd: 5 sec
- Database queries: 12
```

Succes met testen! 🚀

