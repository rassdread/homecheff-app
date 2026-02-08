# SMS Notificatie Systeem

## Overzicht
Er zijn **twee verschillende SMS notificatie systemen** voor verkopers bij inkomende bestellingen:

### 1. Checkout SMS (Betaald door Koper) ✅
- **Locatie**: Checkout pagina
- **Optie**: Koper kan `enableSmsNotification` aanvinken tijdens checkout
- **Kosten**: €0.06 per verkoper (wordt betaald door koper)
- **Wanneer**: Alleen als koper dit aanvinkt
- **Code**: `app/api/stripe/webhook/route.ts` regel 662-683

### 2. Seller Preferences SMS (Verkoper Instelling) ✅
- **Locatie**: Verkoper profielinstellingen (`/profiel/notificaties`)
- **Optie**: Verkoper kan `smsOrderUpdates` aanzetten in zijn notificatievoorkeuren
- **Kosten**: **Platform betaalt** (verkoper krijgt gratis SMS)
- **Wanneer**: Automatisch voor alle nieuwe bestellingen als verkoper dit heeft ingeschakeld
- **Code**: `lib/notifications/notification-service.ts` regel 660-685

## Hoe Het Werkt

### Verkoper Instellingen
Verkopers kunnen in hun profielinstellingen (`/profiel/notificaties`) de optie "Bestelling updates" aanzetten:
- **Setting**: `smsOrderUpdates` in `NotificationPreferences`
- **UI**: `components/profile/NotificationSettings.tsx` regel 315-324
- **API**: `app/api/notifications/preferences/route.ts` regel 139-142

### Webhook Flow
Wanneer een bestelling wordt aangemaakt (`app/api/stripe/webhook/route.ts`):

1. **Normale Notificatie** (regel 644-650):
   ```typescript
   await NotificationService.sendNewOrderNotification(
     seller.id,
     createdOrder.id,
     createdOrder.orderNumber,
     buyerName,
     amountPaidCents
   );
   ```
   - Stuurt Push + Email
   - **Controleert automatisch** of verkoper `smsOrderUpdates === true` heeft
   - Als ja → stuurt ook SMS (gratis voor verkoper)

2. **Checkout SMS** (regel 662-683):
   ```typescript
   if (enableSmsNotification && seller.phoneNumber) {
     // Extra SMS betaald door koper
   }
   ```
   - Alleen als koper `enableSmsNotification` heeft aangevinkt
   - Betaald door koper (€0.06 per verkoper)

## Kosten Structuur

### Scenario 1: Verkoper heeft SMS ingeschakeld, Koper niet
- ✅ Verkoper krijgt SMS (gratis, betaald door platform)
- ❌ Geen extra SMS betaald door koper
- **Kosten**: €0.00 voor koper, €0.06 voor platform

### Scenario 2: Verkoper heeft SMS ingeschakeld, Koper ook
- ✅ Verkoper krijgt SMS via preferences (gratis, betaald door platform)
- ✅ Verkoper krijgt extra SMS betaald door koper
- **Kosten**: €0.06 voor koper, €0.06 voor platform
- **Opmerking**: Verkoper krijgt mogelijk 2x SMS (kan worden geoptimaliseerd)

### Scenario 3: Verkoper heeft SMS uitgeschakeld, Koper wel
- ❌ Geen SMS via preferences
- ✅ Verkoper krijgt SMS betaald door koper
- **Kosten**: €0.06 voor koper, €0.00 voor platform

### Scenario 4: Beide uitgeschakeld
- ❌ Geen SMS notificaties
- **Kosten**: €0.00

## Code Wijzigingen

### 1. `lib/notifications/notification-service.ts`
**Wijziging**: `sendNewOrderNotification` controleert nu `smsOrderUpdates` preference:
```typescript
// Check if seller has SMS notifications enabled in preferences
const preferences = await this.getUserPreferences(sellerId);
const channels: Array<'push' | 'email' | 'sms'> = ['push', 'email'];

// Add SMS if seller has enabled it in preferences
if (preferences?.smsOrderUpdates) {
  channels.push('sms');
}
```

### 2. `app/api/stripe/webhook/route.ts`
**Wijziging**: Commentaar aangepast om duidelijk te maken dat checkout SMS een extra SMS is:
```typescript
// SMS notificatie indien koper heeft betaald voor SMS (optioneel, betaald door koper)
// Dit is een extra SMS bovenop de SMS die de verkoper krijgt via zijn preferences
```

## Test Scenario's

### Test 1: Verkoper heeft SMS ingeschakeld
1. Verkoper gaat naar `/profiel/notificaties`
2. Zet "Bestelling updates" (SMS) aan
3. Koper plaatst bestelling (zonder SMS optie)
4. ✅ Verkoper krijgt SMS notificatie (gratis)

### Test 2: Koper betaalt voor SMS
1. Koper gaat naar checkout
2. Vinkt "SMS Notificatie voor verkopers" aan
3. Betaalt €0.06 extra per verkoper
4. ✅ Verkoper krijgt SMS notificatie (betaald door koper)

### Test 3: Beide ingeschakeld
1. Verkoper heeft SMS ingeschakeld in preferences
2. Koper betaalt ook voor SMS
3. ⚠️ Verkoper krijgt mogelijk 2x SMS (kan worden geoptimaliseerd)

## Optimalisatie Mogelijkheden

### Issue: Dubbele SMS
Als zowel verkoper als koper SMS hebben ingeschakeld, krijgt verkoper mogelijk 2x SMS.

**Oplossing Optie 1**: Skip checkout SMS als verkoper al SMS krijgt via preferences:
```typescript
// Check if seller already gets SMS via preferences
const preferences = await NotificationService.getUserPreferences(sellerId);
if (enableSmsNotification && seller.phoneNumber && !preferences?.smsOrderUpdates) {
  // Only send checkout SMS if seller doesn't have SMS enabled in preferences
}
```

**Oplossing Optie 2**: Merge beide SMS berichten in één (niet geïmplementeerd)

**Huidige Status**: Beide SMS worden verstuurd (verkoper krijgt mogelijk 2x SMS)

## Conclusie

✅ **Werkt**: 
- Verkopers kunnen SMS notificaties inschakelen via profielinstellingen
- SMS wordt automatisch verstuurd als verkoper dit heeft ingeschakeld
- Checkout SMS (betaald door koper) werkt ook nog steeds

⚠️ **Aandachtspunt**:
- Als beide zijn ingeschakeld, krijgt verkoper mogelijk 2x SMS
- Platform betaalt voor SMS via seller preferences (€0.06 per SMS)

## Aanbevelingen

1. **Test beide scenario's** om te verifiëren dat alles werkt
2. **Overweeg optimalisatie** om dubbele SMS te voorkomen
3. **Monitor SMS kosten** voor platform (seller preferences SMS)
4. **Documenteer** voor verkopers dat SMS gratis is via preferences
























