# Affiliate Programma: 12 Maanden Regel - Uitleg

## ✅ Hoe het werkt:

### 1. Affiliate Account Status
- **Geen tijdlimiet**: Je affiliate account blijft actief zolang je status `ACTIVE` is
- Je kunt **altijd** mensen aanbrengen, er is geen 12-maanden limiet op wanneer je mensen kunt aanbrengen
- Je referral links blijven altijd geldig

### 2. Revenue Share Window (12 maanden)
**Per referral die je aanbrengt:**
- ✅ Je krijgt **12 maanden lang** commissie op die specifieke referral
- ✅ De 12 maanden starten vanaf het moment dat de persoon zich aanmeldt
- ✅ Na 12 maanden stopt de commissie voor die specifieke referral

### 3. Voorbeeld Scenario:

**Dag 1 (1 januari 2025):**
- Je wordt affiliate
- Je brengt Bedrijf A aan → Bedrijf A meldt zich aan
- ✅ Je krijgt 12 maanden commissie op Bedrijf A (tot 1 januari 2026)

**Dag 30 (30 januari 2025):**
- Je brengt Bedrijf B aan → Bedrijf B meldt zich aan
- ✅ Je krijgt 12 maanden commissie op Bedrijf B (tot 30 januari 2026)

**Dag 365 (1 januari 2026):**
- ❌ Commissie op Bedrijf A stopt (12 maanden voorbij)
- ✅ Commissie op Bedrijf B gaat nog door (nog 335 dagen)

**Dag 730 (1 januari 2027):**
- ❌ Commissie op Bedrijf B stopt (12 maanden voorbij)
- ✅ Je kunt nog steeds nieuwe bedrijven aanbrengen!

### 4. Technische Implementatie:

#### Attribution Record
```typescript
{
  affiliateId: "affiliate-123",
  userId: "user-456", // De persoon die je hebt aangebracht
  startsAt: "2025-01-01T00:00:00Z",
  endsAt: "2026-01-01T00:00:00Z", // startsAt + 365 dagen
  type: "BUSINESS_SIGNUP"
}
```

#### BusinessSubscription Record
```typescript
{
  businessUserId: "user-456",
  attributionId: "attribution-789",
  startsAt: "2025-01-01T00:00:00Z",
  endsAt: "2026-01-01T00:00:00Z", // Revenue share window
  // Elke maandelijkse betaling binnen deze window → commissie
}
```

#### Commission Check
```typescript
// Bij elke invoice.paid event:
if (now > businessSubscription.endsAt) {
  // ❌ Revenue share window is voorbij, geen commissie
} else {
  // ✅ Binnen window, commissie wordt aangemaakt
}
```

### 5. Belangrijke Punten:

✅ **Je kunt altijd mensen aanbrengen**
- Geen limiet op wanneer je referrals kunt maken
- Je affiliate account heeft geen vervaldatum

✅ **Per referral: 12 maanden commissie**
- Elke persoon die je aanbrengt heeft zijn eigen 12-maanden window
- De window start vanaf het moment van aanmelding
- Na 12 maanden stopt de commissie voor die specifieke referral

✅ **Meerdere referrals = meerdere windows**
- Referral A: 12 maanden vanaf 1 januari
- Referral B: 12 maanden vanaf 15 februari
- Referral C: 12 maanden vanaf 1 maart
- etc.

### 6. Configuratie:

```typescript
// lib/affiliate-config.ts
export const ATTRIBUTION_WINDOW_DAYS = 365; // 12 maanden
```

Dit betekent:
- Elke `Attribution` heeft `endsAt = startsAt + 365 dagen`
- Elke `BusinessSubscription` heeft `endsAt = startsAt + 365 dagen`
- Commissies worden alleen aangemaakt als `now <= endsAt`

---

## 📊 Samenvatting:

| Aspect | Regel |
|--------|-------|
| **Affiliate account** | Geen tijdlimiet, blijft actief |
| **Wanneer mensen aanbrengen** | Altijd mogelijk, geen limiet |
| **Commissie per referral** | 12 maanden vanaf aanmelding |
| **Meerdere referrals** | Elke referral heeft eigen 12-maanden window |

---

## ✅ Conclusie:

**Het affiliate programma zelf heeft GEEN 12-maanden limiet.**
**MAAR: elke referral die je aanbrengt heeft een 12-maanden revenue share window.**

Dit betekent:
- ✅ Je kunt altijd nieuwe mensen aanbrengen
- ✅ Per referral krijg je 12 maanden lang commissie
- ✅ Na 12 maanden stopt de commissie voor die specifieke referral
- ✅ Je kunt nieuwe referrals blijven aanbrengen voor onbepaalde tijd

De implementatie is correct! 🎉








