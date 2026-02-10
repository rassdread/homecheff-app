# 📦 Bestellingen Notificaties - Implementatie Plan

## 📋 Samenvatting van Huidige Situatie

### ✅ Wat er al bestaat:

1. **Notificatie Systeem** (`lib/notifications/notification-service.ts`)
   - Pusher (in-app) notificaties
   - Email notificaties
   - SMS notificaties (optioneel)
   - Database opslag van notificaties

2. **Chat Notificaties** 
   - Werkt volledig via `NotificationService.sendChatNotification()`
   - Real-time via Pusher

3. **Order Flow**
   - Checkout flow (`app/api/checkout/route.ts`)
   - Stripe webhook (`app/api/stripe/webhook/route.ts`)
   - Order creation na betaling
   - Basis notificaties voor buyer en seller

4. **Delivery Flow**
   - Delivery orders creation
   - Status updates (PENDING → ACCEPTED → PICKED_UP → DELIVERED)
   - Basis notificaties voor beschikbare bezorgers

5. **Order Status Updates**
   - `lib/orderMessaging.ts` - OrderMessagingService
   - Status updates via chat berichten

### ❌ Wat er ontbreekt/verbeterd moet worden:

1. **Volledige Notificatie Reeks voor Bestellingen**
2. **Countdown Timer voor Bezorging**
3. **Georganiseerde Notificatie Center met Tabs**
4. **Tijdlijn Notificaties voor alle Rollen**
5. **Betere Status Update Notificaties**

---

## 🎯 Te Implementeren Features

### 1. **Volledige Notificatie Reeks**

#### Voor Koper (Buyer):
```
1. ✅ Bestelling geplaatst (na checkout)
   - "Je bestelling is geplaatst en wordt verwerkt"
   - Link naar order details

2. ✅ Bestelling betaald (na webhook)
   - "Je betaling is ontvangen, bestelling wordt voorbereid"
   - Link naar order tracking

3. ⏰ Met Bezorging: Countdown Timer Start
   - "Je bestelling wordt bezorgd binnen 3 uur"
   - Live countdown timer in notificatie
   - Link naar live tracking

4. 🚚 Bezorger Geaccepteerd
   - "Je bestelling is geaccepteerd door [Bezorger Naam]"
   - Link naar chat met bezorger

5. 📦 Product Opgehaald
   - "Je bestelling is opgehaald en onderweg naar jou"
   - Link naar live tracking

6. ✅ Bezorgd
   - "Je bestelling is succesvol bezorgd!"
   - Link naar review schrijven

7. 📍 Zonder Bezorging: Klaar voor Ophalen
   - "Je bestelling is klaar voor ophalen bij [Verkoper]"
   - Link naar afhaaladres + chat
```

#### Voor Verkoper (Seller):
```
1. ✅ Nieuwe Bestelling Ontvangen
   - "Nieuwe bestelling van [Koper Naam]"
   - Bedrag, ordernummer
   - Link naar order details

2. ✅ Betaling Ontvangen
   - "Betaling ontvangen voor bestelling #[orderNumber]"
   - Link naar order beheer

3. 📦 Met Bezorging: Bezorger Toegewezen
   - "Bezorger [Naam] heeft je bestelling geaccepteerd"
   - Link naar order tracking

4. 🚚 Product Opgehaald door Bezorger
   - "Je product is opgehaald en onderweg"
   - Link naar tracking

5. ✅ Bestelling Bezorgd
   - "Bestelling #[orderNumber] is succesvol bezorgd"
   - Link naar order details

6. 📍 Zonder Bezorging: Klaar voor Ophalen
   - "Bestelling is klaar, klant kan ophalen"
   - Link naar order beheer
```

#### Voor Bezorger (Delivery Person):
```
1. 🔔 Nieuwe Bezorgopdracht Beschikbaar
   - "Nieuwe bezorgopdracht in jouw gebied!"
   - Afstand, bezorgkosten, geschatte tijd
   - Link naar accepteer/weiger

2. ✅ Opdracht Geaccepteerd
   - "Je hebt de bezorgopdracht geaccepteerd"
   - Ophaal- en bezorgadres
   - Link naar dashboard

3. ⏰ Countdown Timer Start (3 uur)
   - "Je hebt 3 uur om de bestelling te bezorgen"
   - Live countdown timer
   - Waarschuwing bij 30 min, 15 min, 5 min

4. 📦 Product Opgehaald
   - "Product opgehaald, ga naar bezorgadres"
   - Link naar navigatie

5. ✅ Bestelling Bezorgd
   - "Bestelling succesvol bezorgd!"
   - Verdiensten toegevoegd
   - Link naar dashboard
```

---

### 2. **Countdown Timer Implementatie**

#### Database Schema Uitbreiding:
```prisma
model DeliveryOrder {
  // ... bestaande velden
  deliveryDeadline DateTime?  // Wanneer moet het bezorgd zijn (3 uur na acceptatie)
  countdownStartedAt DateTime?  // Wanneer countdown is gestart
  countdownWarningsSent Json?  // Welke waarschuwingen zijn al verstuurd [30, 15, 5]
}
```

#### Countdown Timer Component:
- Real-time countdown in notificatie
- Visuele indicator (groen → geel → rood)
- Waarschuwingen bij:
  - 30 minuten resterend
  - 15 minuten resterend  
  - 5 minuten resterend (urgent)
  - Te laat (rood, urgent)

#### API Endpoint:
```typescript
GET /api/delivery/orders/[orderId]/countdown
// Retourneert: { remainingMinutes, status, warnings }
```

---

### 3. **Notificatie Center Organisatie**

#### Nieuwe Tab Structuur:
```
🔔 Notificatie Bell
   ├─ 💬 Berichten (bestaand)
   ├─ 📦 Bestellingen (NIEUW)
   │   ├─ Mijn Bestellingen (als koper)
   │   ├─ Verkoop Bestellingen (als verkoper)
   │   └─ Bezorgopdrachten (als bezorger)
   ├─ 👍 Props (bestaand)
   ├─ ❤️ Fans (bestaand)
   └─ ⭐ Reviews (bestaand)
```

#### Component Structuur:
```
components/notifications/
  ├─ NotificationBell.tsx (uitbreiden)
  ├─ NotificationCenter.tsx (nieuw)
  │   ├─ MessagesTab.tsx
  │   ├─ OrdersTab.tsx (NIEUW)
  │   │   ├─ BuyerOrdersList.tsx
  │   │   ├─ SellerOrdersList.tsx
  │   │   └─ DeliveryOrdersList.tsx
  │   ├─ PropsTab.tsx
  │   └─ FansTab.tsx
  └─ OrderNotificationItem.tsx (NIEUW)
```

---

### 4. **Notificatie Service Uitbreidingen**

#### Nieuwe Methods in NotificationService:

```typescript
// Order notificaties
static async sendOrderPlacedNotification(buyerId: string, orderId: string)
static async sendOrderPaidNotification(buyerId: string, sellerId: string, orderId: string)
static async sendOrderReadyForPickupNotification(buyerId: string, sellerId: string, orderId: string)
static async sendOrderDeliveredNotification(buyerId: string, sellerId: string, orderId: string)

// Delivery notificaties
static async sendDeliveryOrderAvailableNotification(delivererId: string, deliveryOrderId: string)
static async sendDeliveryAcceptedNotification(buyerId: string, sellerId: string, delivererId: string, orderId: string)
static async sendDeliveryCountdownWarning(delivererId: string, deliveryOrderId: string, minutesRemaining: number)
static async sendDeliveryPickedUpNotification(buyerId: string, sellerId: string, delivererId: string, orderId: string)
static async sendDeliveryCompletedNotification(buyerId: string, sellerId: string, delivererId: string, orderId: string)
```

---

### 5. **Webhook Uitbreidingen**

#### In `app/api/stripe/webhook/route.ts`:

**Na Order Creation:**
```typescript
// 1. Notificatie naar koper: Bestelling geplaatst
await NotificationService.sendOrderPlacedNotification(buyerId, order.id);

// 2. Notificatie naar verkoper: Nieuwe bestelling
await NotificationService.sendNewOrderNotification(sellerId, order.id);

// 3. Als DELIVERY/TEEN_DELIVERY:
//    - Notificatie naar beschikbare bezorgers
//    - Start countdown timer setup
```

**Na Betaling Succes:**
```typescript
// 1. Notificatie naar koper: Betaling ontvangen
await NotificationService.sendOrderPaidNotification(buyerId, sellerId, order.id);

// 2. Notificatie naar verkoper: Betaling ontvangen
await NotificationService.sendPaymentReceivedNotification(sellerId, order.id);

// 3. Als DELIVERY: Start countdown timer
if (deliveryMode === 'DELIVERY' || deliveryMode === 'TEEN_DELIVERY') {
  await startDeliveryCountdown(order.id);
}
```

---

### 6. **Delivery Status Update Notificaties**

#### In `app/api/delivery/orders/[orderId]/accept/route.ts`:

```typescript
// Na acceptatie:
// 1. Notificatie naar bezorger: Opdracht geaccepteerd
await NotificationService.sendDeliveryAcceptedNotification(
  delivererId, orderId
);

// 2. Notificatie naar koper: Bezorger toegewezen
await NotificationService.sendDelivererAssignedNotification(
  buyerId, delivererId, orderId
);

// 3. Notificatie naar verkoper: Bezorger toegewezen
await NotificationService.sendDelivererAssignedToSellerNotification(
  sellerId, delivererId, orderId
);

// 4. Start countdown timer (3 uur)
await startDeliveryCountdown(deliveryOrder.id);
```

#### In `app/api/delivery/orders/[orderId]/update-status/route.ts`:

```typescript
// Bij PICKED_UP:
await NotificationService.sendDeliveryPickedUpNotification(
  buyerId, sellerId, delivererId, orderId
);

// Bij DELIVERED:
await NotificationService.sendDeliveryCompletedNotification(
  buyerId, sellerId, delivererId, orderId
);
```

---

### 7. **Countdown Timer Service**

#### Nieuwe Service: `lib/delivery-countdown.ts`

```typescript
export class DeliveryCountdownService {
  // Start countdown (3 uur vanaf nu)
  static async startCountdown(deliveryOrderId: string): Promise<void>
  
  // Check en stuur waarschuwingen
  static async checkAndSendWarnings(deliveryOrderId: string): Promise<void>
  
  // Get remaining time
  static async getRemainingTime(deliveryOrderId: string): Promise<number>
  
  // Stop countdown (bij bezorging)
  static async stopCountdown(deliveryOrderId: string): Promise<void>
}
```

#### Background Job (Cron):
```typescript
// app/api/cron/delivery-warnings/route.ts
// Check elke minuut voor orders die waarschuwingen nodig hebben
// Stuur notificaties bij 30min, 15min, 5min
```

---

### 8. **Order Status Update Notificaties**

#### In `app/api/orders/[orderId]/update/route.ts`:

```typescript
// Bij status update:
switch (newStatus) {
  case 'PROCESSING':
    await NotificationService.sendOrderProcessingNotification(buyerId, orderId);
    break;
  case 'SHIPPED':
    await NotificationService.sendOrderShippedNotification(buyerId, orderId);
    break;
  case 'DELIVERED':
    await NotificationService.sendOrderDeliveredNotification(buyerId, sellerId, orderId);
    break;
  case 'CANCELLED':
    await NotificationService.sendOrderCancelledNotification(buyerId, sellerId, orderId);
    break;
}
```

---

## 📁 Bestanden die Aangemaakt/Aangepast Moeten Worden

### Nieuwe Bestanden:
```
lib/notifications/order-notifications.ts
lib/delivery-countdown.ts
components/notifications/NotificationCenter.tsx
components/notifications/OrdersTab.tsx
components/notifications/OrderNotificationItem.tsx
components/notifications/DeliveryCountdownTimer.tsx
app/api/delivery/orders/[orderId]/countdown/route.ts
app/api/cron/delivery-warnings/route.ts
```

### Aan te Passen Bestanden:
```
lib/notifications/notification-service.ts (uitbreiden)
app/api/stripe/webhook/route.ts (notificaties toevoegen)
app/api/delivery/orders/[orderId]/accept/route.ts (notificaties toevoegen)
app/api/delivery/orders/[orderId]/update-status/route.ts (notificaties toevoegen)
app/api/orders/[orderId]/update/route.ts (notificaties toevoegen)
components/notifications/NotificationBell.tsx (tabs toevoegen)
prisma/schema.prisma (DeliveryOrder uitbreiden)
```

---

## 🎨 UI/UX Verbeteringen

### 1. **Notificatie Bell Badge**
- Totaal aantal ongelezen notificaties
- Breakdown per type (berichten, bestellingen, etc.)
- Kleurcodering: rood voor urgent, oranje voor belangrijk

### 2. **Orders Tab in Notificatie Center**
- Lijst met alle order notificaties
- Filter op status (actief, voltooid, geannuleerd)
- Sorteer op datum (nieuwste eerst)
- Quick actions:
  - "Bekijk order" → `/orders/[orderId]`
  - "Chat met verkoper/bezorger" → `/messages?conversation=[id]`
  - "Track bezorging" → `/orders/[orderId]/tracking`

### 3. **Countdown Timer Visualisatie**
- Progress bar (groen → geel → rood)
- Grote countdown timer in notificatie
- Waarschuwingen visueel benadrukt
- Link naar live tracking

### 4. **Order Status Timeline**
- Visuele timeline in order notificatie
- Huidige status gemarkeerd
- Volgende stappen getoond
- Geschatte tijd per stap

---

## 🔄 Integratie met Bestaande Systemen

### 1. **Chat Integratie**
- Order notificaties linken naar order conversation
- Automatische berichten in conversation bij status updates
- Directe chat vanuit notificatie

### 2. **Order Tracking**
- Notificaties linken naar order tracking pagina
- Real-time updates in tracking component
- GPS tracking voor bezorging (indien beschikbaar)

### 3. **Review Systeem**
- Notificatie na bezorging: "Schrijf een review"
- Link naar review formulier
- Herinnering na 24 uur indien nog niet gereviewd

---

## 📊 Database Schema Wijzigingen

### DeliveryOrder Model Uitbreiding:
```prisma
model DeliveryOrder {
  // ... bestaande velden
  deliveryDeadline      DateTime?  // Wanneer moet het bezorgd zijn
  countdownStartedAt   DateTime?  // Wanneer countdown is gestart
  countdownWarningsSent Json?      // Array van verstuurde waarschuwingen [30, 15, 5]
  estimatedDeliveryTime Int?       // Geschatte bezorgtijd in minuten
  actualDeliveryTime    Int?       // Werkelijke bezorgtijd in minuten
}
```

### Notification Model Uitbreiding:
```prisma
model Notification {
  // ... bestaande velden
  orderId          String?  // Link naar order (indien order gerelateerd)
  deliveryOrderId  String?  // Link naar delivery order (indien delivery gerelateerd)
  countdownData    Json?    // Countdown timer data {remainingMinutes, deadline}
}
```

---

## 🚀 Implementatie Volgorde

### Fase 1: Basis Notificaties (Prioriteit: Hoog)
1. ✅ Uitbreiden `NotificationService` met order notificatie methods
2. ✅ Notificaties toevoegen in webhook na order creation
3. ✅ Notificaties toevoegen in delivery accept/update endpoints
4. ✅ Testen van basis flow

### Fase 2: Countdown Timer (Prioriteit: Hoog)
1. ✅ Database schema uitbreiden
2. ✅ `DeliveryCountdownService` implementeren
3. ✅ Countdown timer component maken
4. ✅ Background job voor waarschuwingen
5. ✅ Integratie in notificaties

### Fase 3: Notificatie Center Organisatie (Prioriteit: Medium)
1. ✅ `NotificationCenter` component met tabs
2. ✅ `OrdersTab` component
3. ✅ Filter en sort functionaliteit
4. ✅ UI/UX verbeteringen

### Fase 4: Advanced Features (Prioriteit: Laag)
1. ⏳ GPS tracking notificaties
2. ⏳ Review reminder notificaties
3. ⏳ Analytics en rapportage
4. ⏳ Push notificaties voor mobile

---

## 🧪 Test Scenario's

### Test 1: Volledige Order Flow (Met Bezorging)
1. Koper plaatst bestelling → Notificatie naar koper en verkoper
2. Betaling voltooid → Notificatie naar koper en verkoper
3. Bezorger accepteert → Notificaties naar alle partijen + countdown start
4. Product opgehaald → Notificatie naar alle partijen
5. Bezorgd → Notificatie naar alle partijen

### Test 2: Order Flow (Zonder Bezorging)
1. Koper plaatst bestelling → Notificatie naar koper en verkoper
2. Betaling voltooid → Notificatie naar koper en verkoper
3. Verkoper markeert als klaar → Notificatie naar koper
4. Koper haalt op → Status update → Notificatie naar verkoper

### Test 3: Countdown Timer
1. Bezorger accepteert → Countdown start (3 uur)
2. Na 2.5 uur → Waarschuwing (30 min resterend)
3. Na 2.75 uur → Waarschuwing (15 min resterend)
4. Na 2.92 uur → Urgente waarschuwing (5 min resterend)
5. Na 3 uur → Te laat notificatie (indien nog niet bezorgd)

### Test 4: Notificatie Center
1. Open notificatie bell → Zie tabs
2. Klik op "Bestellingen" tab → Zie order notificaties
3. Filter op status → Correcte filtering
4. Klik op notificatie → Link naar juiste pagina

---

## 📝 Notities

### Best Practices:
- Alle notificaties moeten optioneel zijn (user preferences)
- Real-time updates via Pusher waar mogelijk
- Fallback naar email voor belangrijke notificaties
- Database logging voor alle notificaties (voor debugging)
- Rate limiting voor notificaties (voorkom spam)

### Performance:
- Batch notificaties waar mogelijk
- Lazy loading van notificatie lijsten
- Caching van countdown timers
- Background jobs voor waarschuwingen (niet blocking)

### Security:
- Valideer user permissions voor elke notificatie
- Geen gevoelige data in notificaties (alleen metadata)
- Rate limiting per user
- Audit log voor alle notificaties

---

## ✅ Checklist

### Basis Functionaliteit
- [ ] Order notificatie methods in NotificationService
- [ ] Notificaties in webhook (order creation)
- [ ] Notificaties in webhook (payment success)
- [ ] Notificaties in delivery accept endpoint
- [ ] Notificaties in delivery status update endpoint
- [ ] Notificaties in order status update endpoint

### Countdown Timer
- [ ] Database schema uitbreiding
- [ ] DeliveryCountdownService implementatie
- [ ] Countdown timer component
- [ ] Background job voor waarschuwingen
- [ ] Waarschuwing notificaties (30, 15, 5 min)

### UI/UX
- [ ] NotificationCenter component met tabs
- [ ] OrdersTab component
- [ ] OrderNotificationItem component
- [ ] DeliveryCountdownTimer component
- [ ] Filter en sort functionaliteit
- [ ] Badge updates in NotificationBell

### Testing
- [ ] Test volledige order flow (met bezorging)
- [ ] Test order flow (zonder bezorging)
- [ ] Test countdown timer
- [ ] Test notificatie center
- [ ] Test user preferences
- [ ] Test rate limiting

---

**Status**: 📋 Plan Klaar voor Implementatie
**Volgende Stap**: Start met Fase 1 - Basis Notificaties


