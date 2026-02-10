# Voorraad Beveiliging Analyse

## Huidige Situatie

### ✅ Wat werkt:
1. **Idempotency Check**: Webhook controleert op `stripeSessionId` om dubbele orders te voorkomen
2. **Atomische Stock Check**: Checkout controleert voorraad atomisch in transaction
3. **Atomische Stock Decrement**: Webhook haalt voorraad atomisch af in transaction

### ❌ Probleem:
**GEEN reservering systeem** - tussen checkout en betaling kan iemand anders de voorraad opkopen

## Flow Nu:
1. Checkout: Atomische stock check ✅
2. Stripe Session: Wordt aangemaakt ✅
3. **GAP**: Tussen checkout en betaling is voorraad NIET gereserveerd ❌
4. Webhook: Voorraad wordt pas afgehaald na betaling ✅

## Probleem Scenario:
- Gebruiker A: Checkout → Stripe session (voorraad: 5)
- Gebruiker B: Checkout → Stripe session (voorraad: 5) ← Ziet nog steeds 5!
- Gebruiker A: Betaalt → Voorraad wordt 4
- Gebruiker B: Betaalt → Voorraad wordt 3 (maar had al 5 moeten zien!)

## Oplossing: StockReservation Systeem ✅ GEÏMPLEMENTEERD

### Nieuwe Flow:
1. Checkout: Atomische stock check + **reservering maken** (voorraad - gereserveerd) ✅
2. Stripe Session: Wordt aangemaakt met reservering ✅
3. **Reservering**: Voorraad is gereserveerd voor 15 minuten ✅
4. Webhook: Reservering bevestigen → Voorraad definitief afhalen ✅
5. Timeout: Verlopen reserveringen worden automatisch vrijgegeven ✅

### Implementatie Details:

#### 1. Database Schema
- ✅ `StockReservation` model toegevoegd met:
  - `productId`, `stripeSessionId`, `quantity`
  - `expiresAt` (15 minuten na checkout)
  - `status` (PENDING, CONFIRMED, EXPIRED, CANCELLED)
- ✅ Relatie met `Product` model

#### 2. Checkout API (`app/api/checkout/route.ts`)
- ✅ Stock check berekent: `availableStock = stock - gereserveerdeQuantity`
- ✅ Maakt reserveringen na Stripe session creation
- ✅ Reserveringen verlopen na 15 minuten

#### 3. Webhook (`app/api/stripe/webhook/route.ts`)
- ✅ Vindt reservering per product + session
- ✅ Update reservering naar `CONFIRMED` status
- ✅ Haalt voorraad definitief af (atomisch)

#### 4. Cleanup Job (`app/api/cron/cleanup-stock-reservations/route.ts`)
- ✅ Vindt verlopen PENDING reserveringen
- ✅ Update naar `EXPIRED` status
- ✅ Kan worden aangeroepen door cron job (elke 5 minuten)

### Beveiliging:
1. ✅ **Idempotency**: Webhook controleert op `stripeSessionId`
2. ✅ **Atomische Stock Check**: Checkout + reservering in transaction
3. ✅ **Reservering**: Voorraad gereserveerd tijdens checkout
4. ✅ **Atomische Stock Decrement**: Webhook haalt voorraad atomisch af
5. ✅ **Timeout**: Verlopen reserveringen worden automatisch vrijgegeven

