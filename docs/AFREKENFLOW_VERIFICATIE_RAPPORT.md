# Afrekenflow Verificatie Rapport

## Overzicht
Dit rapport verifieert of de volledige afrekenflow consistent is gekoppeld tussen:
- Betalingen (Stripe)
- Bezorgers percentages
- Abonnementen
- Admin dashboard

---

## 1. PLATFORM FEES VOOR VERKOPERS ✅ (GEFIXT)

### Correcte Percentages:
- **Individueel (geen abonnement)**: 12% ✅
- **BASIC abonnement**: 7% ✅
- **PRO abonnement**: 4% ✅
- **PREMIUM abonnement**: 2% ✅

### Locaties:
- ✅ `lib/fees.ts`: DEFAULT_PLATFORM_FEE_PERCENT = 12%
- ✅ `app/api/stripe/webhook/route.ts`: 12% default, checkt subscription tier
- ✅ `app/api/admin/financial/route.ts`: **GEFIXT** - nu 12% default, checkt subscription tiers
- ✅ `app/api/seller/earnings/route.ts`: **GEFIXT** - nu checkt subscription tier

### Database:
- ✅ Subscription model: `feeBps` (basis points)
  - BASIC: 700 (7%)
  - PRO: 400 (4%)
  - PREMIUM: 200 (2%)

### Probleem Gevonden & Gefixt:
- ❌ **Admin dashboard gebruikte 10% in plaats van 12%** → ✅ **GEFIXT**
- ❌ **Admin dashboard checkte geen subscription tiers** → ✅ **GEFIXT**
- ❌ **Seller earnings route gebruikte hardcoded 12%** → ✅ **GEFIXT**

---

## 2. DELIVERY FEES ✅

### Correcte Percentages:
- **Bezorger**: 88% ✅
- **Platform**: 12% ✅

### Locaties:
- ✅ `lib/deliveryPricing.ts`: 88% bezorger, 12% platform
- ✅ `app/api/delivery/orders/[orderId]/update-status/route.ts`: 88% bezorger
- ✅ `app/api/stripe/webhook/route.ts`: 12% platform fee (1200 basis points)
- ✅ `app/api/admin/financial/route.ts`: **GEFIXT** - nu berekent delivery fees correct

### Consistentie:
- ✅ Alle berekeningen gebruiken 88/12 split
- ✅ Delivery transactions hebben `platformFeeBps: 1200` (12%)

---

## 3. ABONNEMENTEN ✅

### Subscription Tiers:
- ✅ **BASIC**: €39/jaar, 7% platform fee
- ✅ **PRO**: €99/jaar, 4% platform fee
- ✅ **PREMIUM**: €199/jaar, 2% platform fee

### Database:
- ✅ Subscription model heeft `feeBps` (basis points)
- ✅ SellerProfile heeft `subscriptionId` en `subscriptionValidUntil`

### Webhook Logic:
- ✅ Checkt subscription tier bij betaling
- ✅ Gebruikt `feeBps / 100` voor percentage berekening
- ✅ Fallback naar 12% als geen subscription

---

## 4. ADMIN DASHBOARD ✅ (GEFIXT)

### Platform Fees Berekening:
- ✅ **GEFIXT**: Nu gebruikt 12% default (was 10%)
- ✅ **GEFIXT**: Checkt nu subscription tiers per seller
- ✅ **GEFIXT**: Berekent delivery fees correct

### Revenue Tracking:
- ✅ Total revenue: som van alle order amounts
- ✅ Subscription revenue: apart getrackt
- ✅ Platform fees: product fees + delivery fees
- ✅ Payouts: som van alle payout amounts

### Monthly Stats:
- ✅ **GEFIXT**: Nu gebruikt correcte percentages per subscription tier
- ✅ **GEFIXT**: Berekent delivery fees per maand

---

## 5. BETALINGEN FLOW ✅

### Stripe Webhook:
1. ✅ Order wordt aangemaakt
2. ✅ Platform fee wordt berekend op basis van subscription tier
3. ✅ Transaction wordt aangemaakt met `platformFeeBps`
4. ✅ Payout wordt aangemaakt voor seller (na platform fee)
5. ✅ Delivery fee wordt berekend (88/12 split)
6. ✅ Delivery transaction wordt aangemaakt
7. ✅ Delivery payout wordt aangemaakt (bij order completion)

### Consistentie:
- ✅ Alle berekeningen gebruiken dezelfde logica
- ✅ Subscription tiers worden correct gecheckt
- ✅ Delivery fees worden correct berekend

---

## 6. SAMENVATTING FIXES

### Gefixte Problemen:
1. ✅ **Admin dashboard platform fee**: 10% → 12% (default)
2. ✅ **Admin dashboard subscription check**: Nu checkt subscription tiers
3. ✅ **Seller earnings route**: Nu checkt subscription tier
4. ✅ **Delivery fees in admin dashboard**: Nu correct berekend

### Alles Consistent:
- ✅ Platform fees: 12% (individueel), 7/4/2% (subscriptions)
- ✅ Delivery fees: 88% bezorger, 12% platform
- ✅ Admin dashboard: gebruikt correcte percentages
- ✅ Webhook: gebruikt correcte percentages
- ✅ Seller earnings: gebruikt correcte percentages

---

## 7. VERIFICATIE CHECKLIST

- ✅ Platform fee percentages consistent (12%, 7%, 4%, 2%)
- ✅ Delivery fee percentages consistent (88%, 12%)
- ✅ Admin dashboard gebruikt correcte percentages
- ✅ Webhook gebruikt correcte percentages
- ✅ Subscription tiers worden correct gecheckt
- ✅ Delivery fees worden correct berekend
- ✅ Alle payout berekeningen kloppen
- ✅ Revenue tracking is accuraat

---

## STATUS: ✅ ALLES CONSISTENT EN GEFIXT

Alle percentages zijn nu consistent tussen:
- Betalingen (webhook)
- Admin dashboard
- Seller earnings
- Delivery fees
- Abonnementen








