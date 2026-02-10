# Order Status Flow - Volledige Analyse & Schets

## 📊 HUIDIGE SITUATIE

### ✅ WAT WERKT GOED

#### 1. **Kopers - Bestellingen Inzien**
- **Locatie**: `/orders` pagina
- **Route**: Profiel dropdown → "Mijn Bestellingen"
- **API**: `/api/orders?status={filter}`
- **Functionaliteit**: 
  - ✅ Toont alle bestellingen met status
  - ✅ Status filters (Alle, Wachtend, Bevestigd, etc.)
  - ✅ Order details (items, adres, datum)
  - ✅ Link naar chat met verkoper
  - ✅ Link naar order details (`/orders/[orderId]`)
- **Status**: ✅ WERKT - Alleen lezen

#### 2. **Kopers - Order Details**
- **Locatie**: `/orders/[orderId]` pagina
- **Component**: `OrderTracking.tsx`
- **API**: `/api/orders/[orderId]`
- **Functionaliteit**:
  - ✅ Toont order status timeline
  - ✅ Toont bezorg/afhaal info
  - ✅ Toont order items
  - ✅ Link naar chat
- **Status**: ✅ WERKT - Alleen lezen

#### 3. **Verkopers - Bestellingen Inzien**
- **Locatie 1**: `/verkoper/orders` pagina
- **API**: `/api/seller/dashboard/orders`
- **Functionaliteit**:
  - ✅ Toont alle bestellingen
  - ✅ Status filters
  - ✅ Zoek functionaliteit
  - ✅ Link naar order details
  - ❌ GEEN status update formulier
- **Status**: ✅ WERKT - Alleen lezen

- **Locatie 2**: `/seller/orders` pagina
- **API**: `/api/seller/orders`
- **Functionaliteit**:
  - ✅ Toont alle bestellingen
  - ✅ OrderUpdateForm component (status kan worden aangepast!)
  - ✅ Update via `/api/orders/[orderId]/update`
- **Status**: ✅ WERKT - Kan status updaten

#### 4. **Verkopers - Dashboard**
- **Locatie**: `/verkoper/dashboard`
- **Functionaliteit**:
  - ✅ Toont recente bestellingen
  - ✅ Link naar `/verkoper/orders`
- **Status**: ✅ WERKT

---

## ⚠️ PROBLEMEN & ONTBREKENDE KOPPELINGEN

### 🔴 KRITIEK: Notificaties bij Status Updates

#### Probleem 1: Status Update API verstuurt GEEN notificaties
**Locatie**: `app/api/orders/[orderId]/update/route.ts`

**Wat gebeurt er nu:**
- ✅ Order status wordt geüpdatet in database
- ✅ Chat bericht wordt verstuurd via `OrderMessagingService`
- ❌ **GEEN notificatie via `NotificationService.sendOrderNotification`**

**Wat zou moeten gebeuren:**
```typescript
// Na status update:
await NotificationService.sendOrderNotification(
  buyerId,
  orderId,
  orderNumber,
  newStatus, // CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED
  { sellerName, link: `/orders/${orderId}` }
);
```

**Impact:**
- Kopers krijgen GEEN push/email notificatie bij status wijziging
- Alleen chat bericht wordt verstuurd
- Notificatie bell toont GEEN status updates
- Orders tab in `/messages` blijft leeg

---

### 🟡 WAARSCHUWING: Dubbele Routes

#### Probleem 2: Twee verschillende verkoper orders pagina's
1. **`/verkoper/orders`** - Geen update formulier, alleen lezen
2. **`/seller/orders`** - Heeft OrderUpdateForm, kan updaten

**Vraag:** Welke wordt gebruikt? Beide bestaan en werken.

**Aanbeveling:** 
- Eén centrale pagina kiezen
- Of beide behouden maar duidelijk maken wat het verschil is

---

### 🟡 WAARSCHUWING: Frontend-Backend Koppeling

#### Probleem 3: `/verkoper/orders` linkt naar verkeerde detail pagina
**Locatie**: `app/verkoper/orders/page.tsx` regel 252

```typescript
onClick={() => router.push(`/orders/${order.id}`)}
```

**Probleem:**
- Linkt naar `/orders/[orderId]` (koper pagina)
- Zou moeten linken naar verkoper-specifieke order detail pagina
- Of verkoper moet kunnen updaten vanuit detail pagina

---

### 🟢 INFO: Notificaties bij Order Creation

#### Status: ✅ WERKT
**Locatie**: `app/api/stripe/webhook/route.ts`

**Wat gebeurt er:**
- ✅ Notificatie naar koper: `ORDER_CONFIRMED`
- ✅ Notificatie naar verkoper: `ORDER_RECEIVED`
- ✅ Notificatie naar bezorger: `DELIVERY_PENDING` (als delivery)

**Status**: ✅ GOED GEKOPPELD

---

## 📋 VOLLEDIGE FLOW SCHEMA

### **FLOW 1: Order Plaatsen & Betalen**
```
1. Koper → Checkout → Stripe Payment
2. Stripe Webhook → /api/stripe/webhook
   ├─ Order aangemaakt
   ├─ Stock bijgewerkt
   ├─ Conversation aangemaakt
   └─ Notificaties verstuurd:
       ├─ Koper: ORDER_CONFIRMED ✅
       ├─ Verkoper: ORDER_RECEIVED ✅
       └─ Bezorger: DELIVERY_PENDING ✅ (als delivery)
```

### **FLOW 2: Verkoper Update Status**
```
1. Verkoper → /seller/orders
2. Selecteert order → OrderUpdateForm
3. Wijzigt status → handleOrderUpdate()
4. API Call → /api/orders/[orderId]/update
   ├─ Status geüpdatet in database ✅
   ├─ Chat bericht verstuurd ✅
   └─ ❌ NOTIFICATIE ONTBREEKT!
```

### **FLOW 3: Koper Bekijkt Status**
```
1. Koper → Profiel dropdown → "Mijn Bestellingen"
2. Route → /orders
3. API Call → /api/orders?status={filter}
4. Toont orders met status ✅
5. Klik op order → /orders/[orderId]
6. API Call → /api/orders/[orderId]
7. Toont order details ✅
```

### **FLOW 4: Bezorger Update Status**
```
1. Bezorger → /delivery/dashboard
2. Accepteert order → /api/delivery/orders/[orderId]/accept
   ├─ Status: ACCEPTED ✅
   ├─ Notificatie naar koper: DELIVERY_ACCEPTED ✅
   └─ Countdown gestart ✅
3. Update status → /api/delivery/orders/[orderId]/update-status
   ├─ Status: PICKED_UP/DELIVERED ✅
   ├─ Notificatie naar koper: DELIVERY_PICKED_UP/DELIVERED ✅
   └─ Countdown gestopt ✅
```

---

## 🔧 TE IMPLEMENTEREN

### **PRIORITEIT 1: Notificaties bij Status Updates**

**Bestand**: `app/api/orders/[orderId]/update/route.ts`

**Toevoegen na regel 88:**
```typescript
// Send notification to buyer about status update
if (status) {
  const { NotificationService } = await import('@/lib/notifications/notification-service');
  
  // Get buyer info
  const orderWithBuyer = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      userId: true,
      orderNumber: true,
      items: {
        include: {
          Product: {
            include: {
              seller: {
                include: {
                  User: {
                    select: { name: true, username: true }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  if (orderWithBuyer) {
    const sellerName = orderWithBuyer.items[0]?.Product?.seller?.User?.name || 
                      orderWithBuyer.items[0]?.Product?.seller?.User?.username || 
                      'Verkoper';

    await NotificationService.sendOrderNotification(
      orderWithBuyer.userId,
      orderId,
      orderWithBuyer.orderNumber || `ORD-${orderId.slice(-6)}`,
      status as OrderStatus,
      {
        sellerName,
        link: `/orders/${orderId}`
      }
    );
  }
}
```

### **PRIORITEIT 2: Verkoper Orders Pagina Unificatie**

**Optie A**: `/verkoper/orders` uitbreiden met OrderUpdateForm
**Optie B**: `/seller/orders` verwijderen en alleen `/verkoper/orders` gebruiken
**Optie C**: Beide behouden maar duidelijk maken:
- `/verkoper/orders` = Overzicht (read-only)
- `/seller/orders` = Beheer (met updates)

### **PRIORITEIT 3: Order Detail Pagina voor Verkopers**

**Toevoegen**: `/verkoper/orders/[orderId]` pagina
- Toont order details
- Heeft OrderUpdateForm
- Toont chat link
- Toont klant info

---

## 📍 OVERZICHT: Waar zit wat?

### **KOPERS**
| Functie | Locatie | Route | Status |
|---------|---------|-------|--------|
| Bestellingen lijst | Profiel dropdown | `/orders` | ✅ Werkt |
| Order details | Order card klik | `/orders/[orderId]` | ✅ Werkt |
| Status zien | Order card | Status badge | ✅ Werkt |
| Status updaten | - | - | ❌ Niet mogelijk (correct) |
| Notificaties | Notification bell | Dropdown → Bestellingen tab | ⚠️ Geen data (zie probleem 1) |
| Notificaties | Messages pagina | Tab → Bestellingen | ⚠️ Geen data (zie probleem 1) |

### **VERKOPERS**
| Functie | Locatie | Route | Status |
|---------|---------|-------|--------|
| Bestellingen lijst | Dashboard → Bestellingen | `/verkoper/orders` | ✅ Werkt (read-only) |
| Bestellingen beheer | - | `/seller/orders` | ✅ Werkt (met updates) |
| Status updaten | OrderUpdateForm | `/seller/orders` | ✅ Werkt |
| Status updaten | - | `/verkoper/orders` | ❌ Niet mogelijk |
| Notificaties | Notification bell | Dropdown → Bestellingen tab | ✅ Werkt (bij order creation) |
| Order details | Order card klik | `/orders/[orderId]` | ⚠️ Linkt naar koper pagina |

### **BEZORGERS**
| Functie | Locatie | Route | Status |
|---------|---------|-------|--------|
| Orders dashboard | - | `/delivery/dashboard` | ✅ Werkt |
| Status updaten | Dashboard | `/api/delivery/orders/[orderId]/update-status` | ✅ Werkt |
| Notificaties | - | - | ✅ Werkt (bij accept/update) |

---

## 🎯 CONCLUSIE

### **Wat werkt:**
1. ✅ Kopers kunnen bestellingen zien
2. ✅ Verkopers kunnen bestellingen zien
3. ✅ Verkopers kunnen status updaten (via `/seller/orders`)
4. ✅ Notificaties bij order creation
5. ✅ Notificaties bij delivery updates

### **Wat ontbreekt:**
1. ❌ **Notificaties bij verkoper status updates** (KRITIEK)
2. ⚠️ Dubbele verkoper orders pagina's (verwarrend)
3. ⚠️ Verkoper order detail pagina ontbreekt

### **Aanbevelingen:**
1. **Direct fixen**: Notificaties toevoegen aan `/api/orders/[orderId]/update`
2. **Onderzoeken**: Welke verkoper orders pagina moet blijven
3. **Toevoegen**: Order detail pagina voor verkopers


