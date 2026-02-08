# 💰 Volledige Betaal Flow Analyse

## 📊 Huidige Situatie - Volledige Flow Schets

### 1. **AFREKENEN (Checkout Flow)**

#### Stap 1: Checkout Initiatie
- **Locatie**: `app/checkout/page.tsx`
- **API**: `app/api/checkout/route.ts`
- **Proces**:
  1. Gebruiker vult winkelwagen
  2. Selecteert bezorgmethode (PICKUP, DELIVERY, TEEN_DELIVERY, LOCAL_DELIVERY)
  3. Voert adresgegevens in (met coördinaten validatie)
  4. Optioneel: SMS notificatie inschakelen voor verkopers

#### Stap 2: Validatie & Berekening
- ✅ **Voorraad check**: Controleert of producten op voorraad zijn
- ✅ **Stripe Connect check**: Verifieert dat verkopers Stripe Connect hebben
- ✅ **Bezorgkosten berekening**: 
  - Afstand berekening tussen verkoper en koper
  - Gebruikt `calculateDeliveryFee()` of `calculateLongDistanceDeliveryFee()`
  - Breakdown: basis fee + afstand fee
- ✅ **Stripe fee berekening**: `calculateStripeFeeForBuyer()`
- ✅ **SMS kosten**: €0.06 per verkoper (indien ingeschakeld)

#### Stap 3: Stripe Checkout Session
- **Metadata opgeslagen**:
  - `buyerId`, `deliveryMode`, `address`, `notes`
  - `pickupDate`, `deliveryDate`, `deliveryTime`
  - `productsTotalCents`, `deliveryFeeCents`, `stripeFeeCents`
  - `amountPaidCents`, `subtotalCents`
  - Items in compact formaat (chunked voor grote bestellingen)
  - `deliveryFeeBreakdown` (JSON)
  - `coordinates` (JSON)

#### Stap 4: Bezorgbeschikbaarheid Check
- Controleert of bezorging beschikbaar is in het gebied
- API: `/api/delivery/check-availability`
- Slaat beschikbaarheid info op in metadata

---

### 2. **BETALING (Payment Processing)**

#### Stripe Webhook Handler
- **Locatie**: `app/api/stripe/webhook/route.ts`
- **Event**: `checkout.session.completed`

#### Order Creatie Proces:
1. **Order aanmaken**:
   - Status: `CONFIRMED`
   - Order nummer: `ORD-{timestamp}`
   - Slaat alle metadata op

2. **Order Items aanmaken**:
   - Voor elk product in bestelling
   - Koppelt product, quantity, priceCents
   - **Voorraad decrement**: `stock.decrement(quantity)`

3. **Conversatie aanmaken**:
   - Automatische chat voor bestelling
   - Deelnemers: koper + alle verkopers
   - System message met afhaal/bezorgadres

4. **Delivery Orders** (indien bezorging):
   - Voor elk product een `DeliveryOrder` record
   - Status: `PENDING` (nog niet toegewezen)
   - Notificeert alle beschikbare bezorgers in de buurt

5. **Notificaties versturen**:
   - ✅ Koper: Bestelling geplaatst
   - ✅ Koper: Betaling ontvangen
   - ✅ Verkoper: Nieuwe bestelling
   - ✅ Verkoper: Betaling ontvangen
   - ✅ Verkoper: SMS notificatie (indien ingeschakeld)
   - ✅ Bezorgers: Nieuwe bezorgopdracht beschikbaar

6. **Review Tokens genereren**:
   - Voor elk order item
   - Token voor later review schrijven

---

### 3. **FINANCIËLE VERWERKING (Payouts)**

#### Verkoper Payouts:
1. **Voor elk product in bestelling**:
   - Berekent platform fee (7-15% afhankelijk van abonnement)
   - Standaard: 12% voor individuen
   - `sellerPayoutCents = itemTotal - platformFeeCents`

2. **Transaction record**:
   - Status: `CAPTURED`
   - Provider: `STRIPE`
   - Slaat platform fee op in basis points

3. **Payout record**:
   - Koppelt aan transaction
   - Bedrag: `sellerPayoutCents`

4. **Stripe Transfer**:
   - Directe transfer naar Stripe Connect account
   - Transfer group: `order_{orderId}`
   - Metadata: orderId, productId, sellerId, platformFeeCents

#### Bezorger Payouts (indien bezorging):
1. **Delivery fee breakdown**:
   - Platform cut: 12% (homecheffCut)
   - Bezorger cut: 88% (delivererCut)

2. **Transaction + Payout**:
   - Wanneer bezorger order accepteert en voltooit
   - Update `DeliveryProfile.totalEarnings`

---

### 4. **DASHBOARDS**

#### A. Koper Dashboard (`app/orders/page.tsx`)
- **Functionaliteit**:
  - ✅ Overzicht van alle bestellingen
  - ✅ Status filter (PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED)
  - ✅ Order details: items, prijzen, verkopers
  - ✅ Afhaal/bezorgadres weergave
  - ✅ Chat koppeling per bestelling
  - ✅ Review schrijven (na DELIVERED)

#### B. Verkoper Dashboard (`app/verkoper/dashboard/page.tsx`)
- **API**: `/api/seller/dashboard/stats`
- **Functionaliteit**:
  - ✅ Totale omzet (met periode filter: 7d, 30d, 90d, 1y)
  - ✅ Totaal bestellingen
  - ✅ Totaal klanten
  - ✅ Gemiddelde beoordeling
  - ✅ Recente bestellingen
  - ✅ Top producten
  - ✅ Export functionaliteit (CSV/PDF)

#### C. Admin Dashboard (`components/admin/AdminDashboard.tsx`)
- **API**: `/api/admin/financial`
- **Functionaliteit**:
  - ✅ Totaal gebruikers, producten, bestellingen
  - ✅ Totale omzet
  - ✅ Platform fees overzicht
  - ✅ Top verkopers (by earnings)
  - ✅ Top bezorgers (by earnings)
  - ✅ Maandelijkse statistieken
  - ✅ Recente bestellingen
  - ✅ Financieel overzicht tab

---

### 5. **ADMIN PANEL REGISTRATIE**

#### Admin User Creatie
- **Locatie**: `app/api/admin/users/route.ts`
- **Proces**:
  1. Admin authenticatie check (ADMIN of SUPERADMIN)
  2. Validatie: email, username, password, role
  3. Email/username uniekheid check
  4. Password hashing (bcrypt, 12 rounds)
  5. User aanmaken met:
     - Auto-verified email
     - Terms/privacy/tax accepted
     - Role-specifieke profielen:
       - **SELLER**: SellerProfile met placeholder KVK/BTW
       - **DELIVERY**: DeliveryProfile met defaults

#### Admin Dashboard Toegang
- **Locatie**: `app/admin/page.tsx`
- **Authenticatie**: Session check + role check
- **Permissions**: Role-based tab filtering
- **Tabs**: Overview, Orders, Financial, Disputes, Settings, Audit, Users, Messages, Sellers, Products, Delivery, Analytics, Moderation, Notifications

---

## ⚠️ GEIDENTIFICEERDE PROBLEMEN & VERBETERPUNTEN

### 🔴 KRITIEK - Directe Actie Vereist

#### 1. **Dubbele Webhook Handlers**
- **Probleem**: Er zijn 2 webhook handlers:
  - `app/api/stripe/webhook/route.ts` (actief, volledig)
  - `app/api/webhooks/stripe/route.ts` (legacy, incomplete)
- **Risico**: Verwarring, mogelijk dubbele order creatie
- **Oplossing**: Verwijder `app/api/webhooks/stripe/route.ts` of merge functionaliteit

#### 2. **Order Status Flow Inconsistentie**
- **Probleem**: 
  - Webhook zet status direct op `CONFIRMED`
  - Maar er zijn ook statussen: `PENDING`, `PROCESSING`, `SHIPPED`
  - Geen duidelijke transitie logica
- **Oplossing**: 
  - Status flow definiëren: `PENDING` → `CONFIRMED` → `PROCESSING` → `SHIPPED` → `DELIVERED`
  - Status updates via dedicated API endpoints

#### 3. **Payout Timing Issue**
- **Probleem**: 
  - Payouts worden direct aangemaakt bij betaling
  - Maar bezorger payout wordt pas aangemaakt bij order acceptatie
  - Inconsistentie in payout timing
- **Oplossing**: 
  - Verkoper payouts: direct (zoals nu)
  - Bezorger payouts: pas bij order acceptatie (zoals nu, maar documenteren)

#### 4. **Delivery Order Status Update**
- **Probleem**: 
  - Delivery orders worden aangemaakt met status `PENDING`
  - Maar er is geen duidelijke flow voor status updates
  - API: `/api/delivery/orders/[orderId]/update-status` bestaat wel
- **Oplossing**: 
  - Documenteren van status flow: `PENDING` → `ACCEPTED` → `PICKED_UP` → `DELIVERED`
  - Koppelen aan main order status updates

#### 5. **Transaction Model Mismatch**
- **Probleem**: 
  - `Transaction` model heeft `reservationId` als required field
  - Maar orders gebruiken geen reservations
  - Dummy reservation IDs worden gebruikt: `res_${order.id}_${productId}`
- **Oplossing**: 
  - Maak `reservationId` optional in schema
  - Of gebruik orderId als reservationId (maar dit is niet semantisch correct)

---

### 🟡 BELANGRIJK - Verbetering Aanbevolen

#### 6. **Error Handling in Webhook**
- **Probleem**: 
  - Veel try-catch blocks die errors loggen maar niet doorgeven
  - Als order creatie faalt, wordt betaling wel verwerkt
  - Geen retry mechanisme
- **Oplossing**: 
  - Idempotency keys implementeren
  - Retry logic voor failed operations
  - Alert systeem voor kritieke failures

#### 7. **Stock Management Race Condition**
- **Probleem**: 
  - Stock wordt gedecrementeerd in webhook
  - Maar er is geen lock mechanisme
  - Race condition mogelijk bij gelijktijdige bestellingen
- **Oplossing**: 
  - Database transactions gebruiken
  - Optimistic locking of pessimistic locking

#### 8. **Payment Success Page**
- **Probleem**: 
  - Geen payment success pagina gevonden
  - Success URL: `/payment/success?session_id={CHECKOUT_SESSION_ID}`
  - Maar pagina bestaat mogelijk niet
- **Oplossing**: 
  - Maak `app/payment/success/page.tsx`
  - Toon order bevestiging
  - Link naar order details

#### 9. **Admin Registratie - Placeholder Data**
- **Probleem**: 
  - Admin kan SELLER aanmaken met placeholder KVK/BTW: `00000000`, `NL000000000B01`
  - Geen validatie of reminder om te updaten
- **Oplossing**: 
  - Validatie toevoegen bij admin user creatie
  - Of duidelijke warning/reminder systeem

#### 10. **Dashboard Data Consistency**
- **Probleem**: 
  - Verschillende dashboards gebruiken verschillende queries
  - Mogelijk inconsistent data tussen dashboards
- **Oplossing**: 
  - Centralized dashboard data service
  - Consistent caching strategy

---

### 🟢 OPTIMALISATIE - Nice to Have

#### 11. **Metadata Size Limitation**
- **Probleem**: 
  - Items worden gechunked in metadata (max 450 chars per chunk)
  - Complexe logica voor chunking
- **Oplossing**: 
  - Overweeg alternatief: opslaan in database, alleen reference in metadata
  - Of gebruik Stripe metadata expansion

#### 12. **Delivery Fee Calculation Caching**
- **Probleem**: 
  - Delivery fee wordt elke keer opnieuw berekend
  - Geen caching van afstand berekeningen
- **Oplossing**: 
  - Cache afstand berekeningen
  - Pre-calculate delivery fees voor populaire routes

#### 13. **Dashboard Performance**
- **Probleem**: 
  - Dashboard queries kunnen traag zijn bij veel data
  - Geen paginatie of limit op sommige queries
- **Oplossing**: 
  - Paginatie implementeren
  - Database indexes optimaliseren
  - Caching layer toevoegen

#### 14. **Admin Financial Overview**
- **Probleem**: 
  - Financial overview toont alleen Stripe-paid orders
  - Subscription orders worden expliciet uitgesloten
  - Maar subscription revenue wordt wel getoond
- **Oplossing**: 
  - Duidelijke scheiding tussen product orders en subscription orders
  - Optioneel: toggle om beide te tonen

#### 15. **Order Number Generation**
- **Probleem**: 
  - Order numbers: `ORD-{timestamp}` of `SUB-{timestamp}`
  - Timestamp kan collisions veroorzaken
- **Oplossing**: 
  - Gebruik UUID of sequentiële nummers
  - Of combineer timestamp met random suffix

---

## 📋 AANBEVOLEN ACTIE PLAN

### Fase 1: Kritieke Fixes (Week 1)
1. ✅ Verwijder/merge dubbele webhook handler
2. ✅ Fix transaction model (reservationId optional)
3. ✅ Maak payment success pagina
4. ✅ Documenteer order status flow

### Fase 2: Belangrijke Verbeteringen (Week 2)
5. ✅ Error handling verbeteren in webhook
6. ✅ Stock management race condition fix
7. ✅ Admin registratie validatie
8. ✅ Delivery order status flow documenteren

### Fase 3: Optimalisaties (Week 3-4)
9. ✅ Dashboard performance optimaliseren
10. ✅ Metadata size optimalisatie
11. ✅ Caching implementeren
12. ✅ Order number generation verbeteren

---

## 🔍 TEST SCENARIO'S

### Test 1: Volledige Betaal Flow
1. Product toevoegen aan winkelwagen
2. Checkout starten
3. Adres invullen
4. Betaling voltooien (Stripe test card)
5. Verifiëren: Order aangemaakt, status CONFIRMED
6. Verifiëren: Payouts aangemaakt voor verkopers
7. Verifiëren: Notificaties verstuurd
8. Verifiëren: Dashboard data correct

### Test 2: Bezorging Flow
1. Bestelling plaatsen met DELIVERY mode
2. Verifiëren: Delivery orders aangemaakt
3. Verifiëren: Bezorgers genotificeerd
4. Bezorger accepteert order
5. Status update: ACCEPTED → PICKED_UP → DELIVERED
6. Verifiëren: Bezorger payout aangemaakt

### Test 3: Admin Registratie
1. Admin logt in
2. Maakt nieuwe SELLER aan
3. Verifiëren: User aangemaakt met SellerProfile
4. Verifiëren: Placeholder KVK/BTW (of validatie error)
5. User logt in en vult profiel aan

### Test 4: Dashboard Consistency
1. Plaats test bestelling
2. Check koper dashboard: order zichtbaar
3. Check verkoper dashboard: order + revenue zichtbaar
4. Check admin dashboard: order + financial data zichtbaar
5. Verifiëren: Alle bedragen consistent

---

## 📝 CONCLUSIE

De betaal flow is **functioneel** maar heeft enkele **kritieke verbeterpunten**:

✅ **Sterke punten**:
- Volledige Stripe integratie
- Goede payout structuur
- Uitgebreide notificaties
- Dashboard functionaliteit

⚠️ **Zwakke punten**:
- Dubbele webhook handlers
- Inconsistente order status flow
- Transaction model mismatch
- Ontbrekende payment success pagina
- Race conditions mogelijk

**Prioriteit**: Focus op Fase 1 fixes voor productiestabiliteit.


