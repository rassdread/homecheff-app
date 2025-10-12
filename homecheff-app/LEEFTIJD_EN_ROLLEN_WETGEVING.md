# ⚖️ Leeftijdsgrenzen en Rollen - Wetgeving & Implementatie

## 🎯 TL;DR - Samenvatting

### **Wat is al geregeld:**
- ✅ **Verkopen**: Stripe Connect verifieert automatisch leeftijd (18+) en identiteit
- ✅ **Recepten/Tuin/Designs**: Vrij toegankelijk vanaf 16 jaar (geen commercie)
- ✅ **Kopen**: Geen leeftijdsrestrictie (betaalmethode is verificatie)

### **Wat moet nog:**
- ⚠️ **Bezorgen**: Leeftijdsverificatie + ouderlijke toestemming voor 16-17 jarigen
- ⚠️ **Seller UI**: Duidelijk maken dat Stripe onboarding nodig is voor betalingen

### **Implementatie prioriteit:**
1. **Hoog**: Bezorgers leeftijdsverificatie (juridisch verplicht)
2. **Medium**: Seller dashboard warnings (gebruiksvriendelijkheid)
3. **Laag**: Creatieve content (al geen restricties)

---

## 📋 Nederlandse Wetgeving

### **Leeftijdsgrenzen voor Online Activiteiten**

#### **1. Algemene Principes**
- **16 jaar**: Minimumleeftijd voor zelfstandige verwerking persoonsgegevens (AVG Art. 8)
- **18 jaar**: Meerderjarig en volledig handelingsbekwaam
- **Onder 18 jaar**: Beperkte handelingsbekwaamheid, ouderlijke toestemming vereist voor sommige activiteiten

#### **2. Commerciële Activiteiten**
- **Voedsel verkopen zonder bedrijf**: Geen strikte leeftijdsgrens, maar **aansprakelijkheid** ligt bij ouders/voogd tot 18 jaar
- **Commerciële transacties**: Vanaf 18 jaar volledig zelfstandig; onder 18 met **ouderlijke toestemming**
- **Betalingsverwerking**: Banken eisen meestal **18 jaar** voor eigen bankrekening
- **🎯 Stripe Connect**: Stripe verifieert automatisch leeftijd (18+) en identiteit bij onboarding - dit is de **primaire verificatie** voor verkopers

#### **3. Platform Verantwoordelijkheden**
Als platform ben je verantwoordelijk voor:
- ✅ **Transparantie**: Duidelijk maken wie de verkoper is
- ✅ **Verificatie**: Controleren of verkopers voldoen aan vereisten
- ✅ **Veiligheid**: Zorgen dat producten veilig zijn
- ✅ **Privacy**: AVG-compliance voor alle gebruikers

---

## 🎯 HomeCheff Implementatie

### **Activiteiten en Leeftijdsgrenzen**

| Activiteit | Minimumleeftijd | Vereisten | Reasoning |
|------------|----------------|-----------|-----------|
| **👤 Account maken** | 16 jaar | Email/username | AVG minimum |
| **🍽️ Recepten delen** | 16 jaar | Geen | Creatieve content, geen commercie |
| **🌱 Tuin posts** | 16 jaar | Geen | Creatieve content, geen commercie |
| **🎨 Designs maken** | 16 jaar | Geen | Creatieve content, geen commercie |
| **🛒 Kopen** | 16 jaar | Betaalmethode | Consumenten activiteit |
| **💰 Verkopen (CHEFF)** | 18 jaar | **Stripe Connect verificatie** | Commerciële activiteit met voedsel |
| **💰 Verkopen (GROWN)** | 18 jaar | **Stripe Connect verificatie** | Commerciële activiteit |
| **💰 Verkopen (DESIGNER)** | 18 jaar | **Stripe Connect verificatie** | Commerciële activiteit |
| **🚴 Bezorgen** | 16 jaar | + Ouderlijke toestemming <18 | Werkzaamheden met beperkte risico's |

### **Rol Scheiding**

```typescript
// User kan MEERDERE rollen hebben:
{
  role: 'USER' | 'ADMIN',  // Basis rol
  
  // Activiteiten arrays (toegang per leeftijd):
  buyerRoles: [],          // 16+: ['BUYER']
  sellerRoles: [],         // 18+ (of 16+ met consent): ['CHEFF', 'GROWN', 'DESIGNER']
  
  // Separate profielen:
  DeliveryProfile: {},     // 16+ met parental consent <18
  SellerProfile: {},       // 18+ (of 16+ met consent)
  Business: {},            // Optioneel voor zakelijke verkopers
  
  // Leeftijdsverificatie:
  dateOfBirth: Date,
  ageVerified: boolean,
  parentalConsentGiven: boolean,  // Voor <18
  parentalConsentDate: DateTime
}
```

---

## 🔒 Implementatie Strategie

### **1. Database Schema Aanpassingen**

```prisma
model User {
  // Leeftijdsverificatie (ALLEEN voor Bezorgers <18)
  dateOfBirth                    DateTime?
  ageVerified                    Boolean                   @default(false)
  ageVerifiedAt                  DateTime?
  parentalConsentGiven           Boolean                   @default(false)
  parentalConsentDate            DateTime?
  parentalConsentDocument        String?                   // Upload van getekende toestemming
  
  // Bestaande velden blijven:
  role                           UserRole                  @default(USER)
  buyerRoles                     String[]                  @default([])
  sellerRoles                    String[]                  @default([])
  
  // Stripe verificatie (voor Verkopers - automatisch 18+ check)
  stripeConnectAccountId         String?
  stripeConnectOnboardingCompleted Boolean                @default(false)
  
  // Profielen
  DeliveryProfile                DeliveryProfile?
  SellerProfile                  SellerProfile?
  Business                       Business?
}
```

**Belangrijk**: Voor **verkopen** is Stripe Connect de primaire verificatie. We hoeven GEEN aparte leeftijdsverificatie te bouwen voor verkopers!

### **2. Middleware voor Leeftijdscontrole**

```typescript
// lib/age-verification.ts
export function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  
  return age;
}

export function canUserSell(user: User): {
  canCreateProducts: boolean;
  canReceivePayments: boolean;
  reason?: string;
} {
  // Iedereen kan producten MAKEN (draft mode)
  const canCreateProducts = true;
  
  // Maar alleen verkopen met Stripe verificatie (automatisch 18+ check)
  if (!user.stripeConnectAccountId) {
    return {
      canCreateProducts: true,
      canReceivePayments: false,
      reason: 'Stripe Connect onboarding vereist om betalingen te ontvangen. Stripe verifieert automatisch je leeftijd (18+) en identiteit.'
    };
  }
  
  if (!user.stripeConnectOnboardingCompleted) {
    return {
      canCreateProducts: true,
      canReceivePayments: false,
      reason: 'Voltooi eerst je Stripe onboarding om betalingen te kunnen ontvangen.'
    };
  }
  
  return {
    canCreateProducts: true,
    canReceivePayments: true
  };
}

// Stripe Connect doet automatisch:
// ✅ Leeftijdsverificatie (18+)
// ✅ Identiteitsverificatie (ID check)
// ✅ Bankgegevens verificatie
// ✅ Adres verificatie
// ✅ KYC (Know Your Customer) compliance

export function canUserDeliver(user: User): {
  allowed: boolean;
  reason?: string;
  requiresConsent: boolean;
} {
  if (!user.dateOfBirth || !user.ageVerified) {
    return {
      allowed: false,
      reason: 'Leeftijd moet worden geverifieerd',
      requiresConsent: false
    };
  }
  
  const age = calculateAge(user.dateOfBirth);
  
  if (age < 16) {
    return {
      allowed: false,
      reason: 'Je moet minimaal 16 jaar zijn om te bezorgen',
      requiresConsent: false
    };
  }
  
  if (age >= 18) {
    return {
      allowed: true,
      requiresConsent: false
    };
  }
  
  // 16-17 jaar
  if (!user.parentalConsentGiven) {
    return {
      allowed: false,
      reason: 'Ouderlijke toestemming vereist voor bezorgen onder 18 jaar',
      requiresConsent: true
    };
  }
  
  return {
    allowed: true,
    requiresConsent: false
  };
}

// Geen restricties voor creatieve content
export function canCreateContent(user: User): boolean {
  if (!user.dateOfBirth) return false;
  const age = calculateAge(user.dateOfBirth);
  return age >= 16; // AVG minimum
}
```

### **3. UI Components voor Rol Selectie**

Op de bezorgpagina en verkoperspagina:

```typescript
// Voordat iemand kan registreren als bezorger/verkoper:
1. Check leeftijd
2. Als <18: Toon ouderlijke toestemmingsformulier
3. Upload getekende toestemming
4. Verificatie door admin (optioneel)
5. Activeer rol
```

---

## 📱 User Journey

### **16-jarige wil bezorgen:**
1. ✅ Account maken (kan al)
2. ✅ Leeftijd invoeren + verifiëren
3. ⚠️ Systeem detecteert: < 18 jaar
4. 📋 Ouderlijke toestemmingsformulier downloaden
5. 📤 Getekend formulier uploaden
6. ⏳ Wachten op verificatie
7. ✅ Bezorger rol geactiveerd

### **19-jarige wil verkopen:**
1. ✅ Account maken
2. 📝 Verkopersprofiel maken (kan alvast producten voorbereiden)
3. 💳 **Stripe Connect onboarding starten**
   - Stripe verifieert automatisch:
     - ✅ Leeftijd (18+)
     - ✅ Identiteit (ID verificatie)
     - ✅ Bankgegevens
     - ✅ Adres
4. ⏳ Wachten op Stripe goedkeuring
5. ✅ Betalingen ontvangen + producten verkopen

**Belangrijk**: Producten kunnen worden gemaakt, maar **uitbetalingen** alleen na Stripe verificatie!

### **17-jarige wil recepten delen:**
1. ✅ Account maken
2. ✅ Direct toegang (geen commercie)
3. 📝 Recept uploaden
4. ✅ Delen met community

---

## 🛡️ Juridische Bescherming

### **Platform Disclaimers**

**Voor minderjarigen die verkopen/bezorgen:**
> "Als je jonger bent dan 18 jaar, heb je toestemming nodig van je ouders/voogd om commerciële activiteiten uit te voeren op HomeCheff. Door deze toestemming te geven, verklaren je ouders/voogd akkoord te gaan met de voorwaarden en aanvaarden zij de juridische verantwoordelijkheid voor jouw activiteiten op het platform."

**Algemene Voorwaarden toevoeging:**
- Minderjarigen (16-18 jaar) mogen alleen met ouderlijke toestemming commerciële activiteiten uitvoeren
- Ouders/voogd zijn aansprakelijk voor schade veroorzaakt door minderjarigen
- Platform behoudt zich het recht voor om verificatie te vragen
- Bij twijfel over leeftijd kan platform account opschorten

---

## ✅ Checklist Implementatie

### **🎯 PRIORITEIT 1: Bezorgers (Direct nodig)**

#### **Database:**
- [ ] Voeg `dateOfBirth` toe aan User model
- [ ] Voeg `ageVerified` toe
- [ ] Voeg `parentalConsentGiven` + `parentalConsentDate` toe
- [ ] Voeg `parentalConsentDocument` (URL) toe

#### **Backend:**
- [ ] Maak `lib/age-verification.ts` met `canUserDeliver()` helper
- [ ] Update `/api/delivery/signup` met leeftijdscheck
- [ ] Maak `/api/delivery/upload-consent` endpoint voor minderjarigen
- [ ] Voeg check toe: geen betalingen uitbetalen zonder verificatie

#### **Frontend:**
- [ ] Leeftijdsinvoer op delivery signup pagina
- [ ] Ouderlijke toestemmingsformulier (downloadable PDF) voor 16-17 jarigen
- [ ] Upload component voor getekende toestemming
- [ ] Waarschuwing: "Je bent jonger dan 18 - ouderlijke toestemming vereist"
- [ ] Admin panel: Review uploaded consent forms

---

### **✅ AL GEDEKT: Verkopers (via Stripe)**

#### **Wat Stripe Connect al doet:**
- ✅ Leeftijdsverificatie (automatisch 18+)
- ✅ Identiteitsverificatie (ID check)
- ✅ Bankgegevens verificatie
- ✅ Adres verificatie
- ✅ KYC compliance

#### **Wat we MOETEN toevoegen:**
- [ ] Duidelijke messaging: "Je kunt producten maken, maar hebt Stripe Connect nodig om te verkopen"
- [ ] Block product "publish" als `stripeConnectOnboardingCompleted === false`
- [ ] Waarschuwing op seller dashboard: "Voltooi Stripe onboarding om betalingen te ontvangen"
- [ ] Badge: "Geverifieerde verkoper" (na Stripe onboarding)

---

### **🎨 AL VRIJ: Creatieve Content**

Geen restricties nodig voor:
- ✅ Recepten maken en delen (geen leeftijdscheck)
- ✅ Tuin content posten (geen leeftijdscheck)  
- ✅ Designs maken en delen (geen leeftijdscheck)

**Reden**: Geen commerciële activiteit = geen verificatie nodig (AVG 16+ is voldoende voor account)

---

## 📞 Support & Helpdesk

Voor vragen over leeftijdsgrenzen:
- Email: support@homecheff.nl
- FAQ sectie met uitleg per leeftijdsgroep
- Chat support voor verificatie vragen

**Belangrijk**: Dit document is een richtlijn. Raadpleeg altijd een juridisch adviseur voor definitieve implementatie!

