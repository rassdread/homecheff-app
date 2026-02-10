# Verbeteringen Lijst - HomeCheff App

## 🔴 PRIORITEIT 1: KRITIEK (Moet gefixt worden)

### 1. SUPERADMIN Access Control Inconsistenties

**Probleem**: SUPERADMIN gebruikers kunnen niet overal waar ADMIN kan komen.

**Locaties die gefixt moeten worden:**

#### a) `app/api/products/[id]/route.ts` (4 plaatsen)
- **Regel 217**: `if (user.role !== 'ADMIN')` → moet ook SUPERADMIN checken
- **Regel 347**: `if (user.role !== 'ADMIN')` → moet ook SUPERADMIN checken  
- **Regel 490**: `if (user.role !== 'ADMIN')` → moet ook SUPERADMIN checken
- **Regel 616**: `if (user.role !== 'ADMIN')` → moet ook SUPERADMIN checken

**Fix**:
```typescript
// Huidig:
if (user.role !== 'ADMIN') {

// Moet worden:
if (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
```

#### b) `components/NavBar.tsx` (regel 514)
- **Probleem**: Admin dashboard link checkt niet expliciet SUPERADMIN
- **Huidig**: `{((user as any)?.role === 'ADMIN' || ...)`
- **Moet worden**: `{(((user as any)?.role === 'ADMIN' || (user as any)?.role === 'SUPERADMIN') || ...)`

**Impact**: SUPERADMIN gebruikers zien mogelijk geen admin dashboard link in navigatie (hoewel ze wel toegang hebben via directe URL).

---

## 🟡 PRIORITEIT 2: BEVEILIGING (Aanbevolen)

### 2. Server-side Role Checks voor Seller Pages

**Probleem**: Seller pages vertrouwen volledig op client-side en API checks. Geen server-side verificatie.

**Pages die server-side checks nodig hebben:**

1. **`app/verkoper/dashboard/page.tsx`**
   - Huidig: Client-side component, geen server-side check
   - Aanbeveling: Voeg server-side check toe zoals in `app/delivery/dashboard/page.tsx`

2. **`app/verkoper/orders/page.tsx`**
   - Check of deze bestaat en voeg role check toe

3. **`app/verkoper/analytics/page.tsx`**
   - Check of deze bestaat en voeg role check toe

4. **`app/verkoper/revenue/page.tsx`**
   - Check of deze bestaat en voeg role check toe

**Voorbeeld implementatie** (zoals in `app/delivery/dashboard/page.tsx`):
```typescript
export default async function SellerDashboardPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }

  const userId = (session.user as any).id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      id: true, 
      sellerRoles: true, 
      role: true 
    }
  });

  const hasSellerRoles = user?.sellerRoles && user.sellerRoles.length > 0;
  const isSeller = user?.role === 'SELLER';

  if (!hasSellerRoles && !isSeller) {
    redirect('/');
  }

  // Render component
}
```

### 3. Delivery Settings Page Check

**Probleem**: `/delivery/settings` heeft geen expliciete role check gevonden.

**Aanbeveling**: Voeg server-side check toe vergelijkbaar met delivery dashboard.

---

## 🟢 PRIORITEIT 3: CONSISTENTIE (Optioneel, maar aanbevolen)

### 4. Centrale Helper Functies

**Probleem**: Rol checks worden op verschillende manieren gedaan door de hele app.

**Aanbeveling**: Maak centrale helper functies in `lib/role-helpers.ts`:

```typescript
// lib/role-helpers.ts

export function hasAdminAccess(user: any): boolean {
  return user?.role === 'ADMIN' || user?.role === 'SUPERADMIN' || 
         (user?.adminRoles && user.adminRoles.length > 0);
}

export function hasSellerAccess(user: any): boolean {
  return user?.role === 'SELLER' || 
         (user?.sellerRoles && user.sellerRoles.length > 0);
}

export function hasDeliveryAccess(user: any): boolean {
  return user?.role === 'DELIVERY' || 
         user?.hasDeliveryProfile ||
         hasSellerAccess(user); // Sellers kunnen ook bezorgen
}
```

**Voordelen**:
- Consistentie door de hele app
- Makkelijker te onderhouden
- Minder bugs bij wijzigingen

### 5. Inconsistente Seller Check in Delivery Dashboard

**Probleem**: `app/delivery/dashboard/page.tsx` checkt alleen `role === 'SELLER'`, niet `sellerRoles` array.

**Huidig** (regel 26):
```typescript
const isSeller = user?.role === 'SELLER';
```

**Moet worden** (consistent met andere checks):
```typescript
const hasSellerRoles = user?.sellerRoles && user.sellerRoles.length > 0;
const isSeller = user?.role === 'SELLER';
```

**Impact**: Gebruikers met sellerRoles maar zonder SELLER role kunnen mogelijk niet bij delivery dashboard (hoewel dit waarschijnlijk zelden voorkomt).

---

## 📋 SAMENVATTING ACTIE ITEMS

### Direct te fixen (Prioriteit 1):
1. ✅ Fix SUPERADMIN checks in `app/api/products/[id]/route.ts` (4x)
2. ✅ Fix SUPERADMIN check in `components/NavBar.tsx` (1x)

### Aanbevolen (Prioriteit 2):
3. ⚠️ Voeg server-side role checks toe aan seller pages
4. ⚠️ Check en fix `/delivery/settings` access control

### Optioneel (Prioriteit 3):
5. 💡 Maak centrale helper functies voor role checks
6. 💡 Fix inconsistente seller check in delivery dashboard

---

## 🎯 IMPACT ANALYSE

### Wat gebeurt er als we niets doen?

**Prioriteit 1 problemen:**
- SUPERADMIN gebruikers kunnen producten niet bewerken via API
- SUPERADMIN gebruikers zien mogelijk geen admin link in navigatie
- **Impact**: Functionele beperking voor SUPERADMIN gebruikers

**Prioriteit 2 problemen:**
- Seller pages zijn kwetsbaar voor directe URL toegang (hoewel API's wel beschermd zijn)
- **Impact**: Potentiële beveiligingsrisico (laag, omdat API's wel beschermd zijn)

**Prioriteit 3 problemen:**
- Inconsistentie maakt code moeilijker te onderhouden
- **Impact**: Onderhoudbaarheid, geen directe functionele impact

---

## ✅ AL GEFIXT

1. ✅ Taal typos in `en.json` (Prorile → Profile, withhod → method)
2. ✅ Total revenue berekening (gebruikt nu orders i.p.v. transactions)
3. ✅ Mode filtering toegevoegd aan seller dashboard stats

---

## 📝 NOTITIES

- Alle functionaliteiten blijven intact tijdens fixes
- Geen breaking changes nodig
- Backward compatible fixes
- Test na elke fix om zeker te zijn dat alles werkt











