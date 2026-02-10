# 💰 Verkoop Flow Test Plan - Financieel

## 🎯 Doel
Volledig testen van de verkoopflow van begin tot eind, inclusief:
- Product creatie
- Stripe Connect onboarding
- Bestellingen plaatsen
- Betalingen verwerken
- Platform fee berekening
- Uitbetalingen naar verkoper

---

## 📊 Huidige Flow Overzicht

### **1. Verkoper Onboarding**
```
User Account → Verkoper Profiel → Stripe Connect Onboarding → Geverifieerde Verkoper
```

### **2. Product Lifecycle**
```
Product Maken → Prijs Instellen → Publiceren → Beschikbaar voor Koop
```

### **3. Order Flow**
```
Klant Bestelt → Stripe Checkout → Betaling Succesvol → Order Status: PAID
```

### **4. Financiële Flow**
```
Betaling Ontvangen → Platform Fee (7-15%) → Seller Payout → Stripe Transfer
```

---

## 🧪 Test Scenario's

### **Scenario 1: Nieuwe Verkoper - Volledige Flow**

#### **Stap 1: Verkoper Registratie**
- [ ] Account aanmaken
- [ ] Email verificatie
- [ ] Profiel invullen

#### **Stap 2: Stripe Connect Setup**
- [ ] Stripe onboarding starten
- [ ] Test mode gebruiken (niet live)
- [ ] Identiteitsgegevens invullen
- [ ] Bankgegevens invoeren
- [ ] Onboarding voltooien

#### **Stap 3: Product Creatie**
- [ ] Verkopersprofiel maken
- [ ] Product toevoegen
  - Categorie: CHEFF / GROWN / DESIGNER
  - Prijs instellen
  - Beschrijving
  - Foto's uploaden
- [ ] Product publiceren

#### **Stap 4: Test Order (als koper)**
- [ ] Inloggen als andere gebruiker (of nieuwe account)
- [ ] Product toevoegen aan winkelwagen
- [ ] Checkout starten
- [ ] Stripe test card gebruiken:
  ```
  Card: 4242 4242 4242 4242
  Expiry: 12/34
  CVC: 123
  ```
- [ ] Betaling voltooien

#### **Stap 5: Order Verificatie**
- [ ] Order status check (admin)
- [ ] Betaling ontvangen check
- [ ] Platform fee berekend?
- [ ] Email notificaties verstuurd?

#### **Stap 6: Payout Check**
- [ ] Verkoper dashboard: pending payout?
- [ ] Bedrag correct? (Totaal - Platform Fee)
- [ ] Stripe dashboard: transfer gepland?

---

### **Scenario 2: Platform Fee Berekening**

Test verschillende subscription tiers:

| Tier | Platform Fee | Test Bedrag | Verwachte Fee | Verkoper Krijgt |
|------|-------------|-------------|---------------|-----------------|
| Free | 15% | €100.00 | €15.00 | €85.00 |
| Basic | 10% | €100.00 | €10.00 | €90.00 |
| Pro | 7% | €100.00 | €7.00 | €93.00 |

**Test Steps:**
- [ ] Maak 3 verkoper accounts (elk met andere tier)
- [ ] Elk maakt product van €100
- [ ] Plaats bestelling bij elk
- [ ] Verify fee berekening klopt

---

### **Scenario 3: Meerdere Producten in 1 Order**

- [ ] Winkelwagen met 3 producten van verschillende verkopers
- [ ] Checkout
- [ ] Verify: elke verkoper krijgt apart payout
- [ ] Verify: platform fee per verkoper correct

---

### **Scenario 4: Refund Flow**

- [ ] Order plaatsen
- [ ] Refund aanvragen
- [ ] Verify: geld terug naar klant
- [ ] Verify: platform fee wordt ook terugbetaald
- [ ] Verify: verkoper ziet refund in dashboard

---

### **Scenario 5: Failed Payment**

- [ ] Use Stripe test card voor decline: `4000 0000 0000 0002`
- [ ] Verify: order status = FAILED
- [ ] Verify: geen payout voor verkoper
- [ ] Verify: klant krijgt error melding

---

## 🔍 Database Checks

### **Tables te Verificeren:**

```sql
-- Check Order
SELECT 
  id, 
  orderNumber,
  status, 
  totalAmount, 
  stripeSessionId,
  createdAt
FROM "Order" 
WHERE id = 'YOUR_ORDER_ID';

-- Check OrderItem (per product)
SELECT 
  oi.id,
  oi.quantity,
  oi.priceAtPurchase,
  oi.platformFeeBps,
  p.title,
  s.displayName as seller
FROM "OrderItem" oi
JOIN "Product" p ON oi.productId = p.id
JOIN "SellerProfile" s ON p.sellerId = s.id
WHERE oi.orderId = 'YOUR_ORDER_ID';

-- Check Payout Status
SELECT 
  id,
  sellerId,
  amountCents,
  status,
  stripeTransferId,
  createdAt
FROM "Payout"
WHERE sellerId = 'YOUR_SELLER_ID';

-- Check Seller's Stripe Status
SELECT 
  id,
  userId,
  stripeConnectAccountId,
  stripeConnectOnboardingCompleted
FROM "SellerProfile"
WHERE userId = 'YOUR_USER_ID';
```

---

## 🛠️ Test Tools & Scripts

### **1. Stripe Test Cards**

```
✅ Success: 4242 4242 4242 4242
❌ Decline: 4000 0000 0000 0002
⏳ Requires Authentication: 4000 0025 0000 3155
💳 Insufficient Funds: 4000 0000 0000 9995
```

### **2. API Test Script**

Ik maak een Node.js script om de flow te testen:

---

## 📝 Test Checklist

### **Pre-Test Setup:**
- [ ] Stripe account in test mode
- [ ] Database backup gemaakt
- [ ] Test users aangemaakt (verkoper + koper)
- [ ] Stripe CLI geïnstalleerd (voor webhooks)

### **Tijdens Test:**
- [ ] Screenshot van elke stap
- [ ] Log errors
- [ ] Noteer response times
- [ ] Check email notificaties

### **Post-Test Verificatie:**
- [ ] Database consistent?
- [ ] Geen orphaned records?
- [ ] Alle webhooks afgehandeld?
- [ ] Logs clean?

---

## 🐛 Bekende Issues / Checklist

### **Te Controleren:**
- [ ] Platform fee wordt correct berekend per OrderItem
- [ ] Stripe webhook voor `checkout.session.completed` werkt
- [ ] Stripe webhook voor `account.updated` werkt
- [ ] Payout wordt alleen aangemaakt na succesvolle betaling
- [ ] Refunds worden correct afgehandeld
- [ ] Multiple sellers in 1 order worden goed gesplitst
- [ ] Email notificaties worden verstuurd
- [ ] Seller dashboard toont correcte balance

---

## 🚀 Quick Start Test

**Snelste manier om de flow te testen:**

```bash
# 1. Start development server
npm run dev

# 2. Open 2 browsers (of incognito):
# Browser 1: Verkoper account
# Browser 2: Koper account

# 3. In Browser 1 (Verkoper):
# - Login als verkoper
# - Ga naar /sell/new
# - Maak product (€10.00)
# - Publiceer

# 4. In Browser 2 (Koper):
# - Login als koper (of nieuw account)
# - Zoek het product
# - Voeg toe aan winkelwagen
# - Checkout
# - Use: 4242 4242 4242 4242

# 5. Check resultaten:
# - Koper: Order confirmation
# - Verkoper: New order notification
# - Admin: Check database queries hierboven
# - Stripe Dashboard: Check payment
```

---

## 📊 Verwachte Resultaten

### **Bij Succesvolle Test:**
✅ Order status: PAID  
✅ Platform fee: correct berekend  
✅ Payout: gepland voor verkoper  
✅ Emails: verzonden naar beide partijen  
✅ Stripe: payment intent succeeded  
✅ Database: consistent

### **Bij Gefaalde Test:**
❌ Order status blijft PENDING  
❌ Webhook niet afgevuurd  
❌ Geen payout aangemaakt  
❌ Database inconsistent  

---

## 🔧 Debug Commands

```bash
# Check Stripe webhooks
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Check database
npm run prisma studio

# Check logs
npm run dev | grep "stripe\|payment\|order"

# Test webhook manually
curl -X POST http://localhost:3000/api/stripe/webhook \
  -H "Content-Type: application/json" \
  -d @test-webhook.json
```

---

## 📞 Hulp Nodig?

Als iets niet werkt:
1. Check Stripe Dashboard voor errors
2. Check database met SQL queries hierboven
3. Check server logs
4. Check browser console
5. Verify webhook endpoints in Stripe

**Test Mode**: Gebruik altijd Stripe test mode voor deze tests!

