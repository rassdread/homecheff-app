# Instellingen & Privacy Verificatie Rapport

## Overzicht
Dit rapport verifieert of alle instellingen en privacy instellingen correct werken en overeenkomen met de functies.

---

## 1. NOTIFICATIE INSTELLINGEN ✅/❌

### Database Schema ✅
**Locatie**: `prisma/schema.prisma` (regel 946-977)

**Instellingen**:
- ✅ `emailNewMessages` - Email bij nieuwe berichten
- ✅ `emailNewOrders` - Email bij nieuwe bestellingen
- ✅ `emailOrderUpdates` - Email bij bestelling updates
- ✅ `emailDeliveryUpdates` - Email bij bezorging updates
- ✅ `emailMarketing` - Marketing emails
- ✅ `emailWeeklyDigest` - Wekelijkse samenvatting
- ✅ `emailSecurityAlerts` - Beveiligingswaarschuwingen
- ✅ `pushNewMessages` - Push bij nieuwe berichten
- ✅ `pushNewOrders` - Push bij nieuwe bestellingen
- ✅ `pushOrderUpdates` - Push bij bestelling updates
- ✅ `pushDeliveryUpdates` - Push bij bezorging updates
- ✅ `pushNearbyProducts` - Push bij nabijgelegen producten
- ✅ `pushSecurityAlerts` - Push beveiligingswaarschuwingen
- ✅ `smsOrderUpdates` - SMS bij bestelling updates
- ✅ `smsDeliveryUpdates` - SMS bij bezorging updates
- ✅ `smsSecurityAlerts` - SMS beveiligingswaarschuwingen
- ✅ `chatSoundEnabled` - Geluid bij chat berichten
- ✅ `chatNotificationPreview` - Preview in notificaties
- ✅ `chatGroupMentionsOnly` - Alleen @vermeldingen in groepen
- ✅ `quietHoursEnabled` - Stille uren inschakelen
- ✅ `quietHoursStart` - Start tijd stille uren
- ✅ `quietHoursEnd` - Eind tijd stille uren

### UI Component ✅
**Locatie**: `components/profile/NotificationSettings.tsx`

**Status**: ✅ **WERKT** - Alle instellingen zijn zichtbaar en kunnen worden aangepast

### API Endpoint ✅
**Locatie**: `app/api/notifications/preferences/route.ts`

**Status**: ✅ **WERKT** - GET en PUT endpoints werken correct

### Probleem: NotificationService.send() ❌
**Locatie**: `lib/notifications/notification-service.ts` (regel 113)

**Probleem**: 
```typescript
const emailEnabled = deliverySettings?.enableEmailNotifications || userPreferences?.emailNewMessages;
```

**Issue**: Dit checkt alleen `emailNewMessages`, maar er zijn verschillende email types:
- `emailNewMessages` - voor chat berichten
- `emailNewOrders` - voor nieuwe bestellingen
- `emailOrderUpdates` - voor bestelling updates
- `emailDeliveryUpdates` - voor bezorging updates

**Impact**: Alle emails worden geblokkeerd als `emailNewMessages === false`, zelfs als andere email instellingen aan staan.

**Fix nodig**: ✅ **JA** - Moet worden aangepast om per notificatie type de juiste preference te checken.

---

## 2. PRIVACY INSTELLINGEN ✅/❌

### Database Schema ✅
**Locatie**: `prisma/schema.prisma` (User model)

**Instellingen**:
- ✅ `messagePrivacy` - Wie mag berichten sturen (EVERYONE, FANS_ONLY, NOBODY)
- ✅ `fanRequestEnabled` - Fan verzoeken toestaan
- ✅ `showFansList` - Fans lijst tonen
- ✅ `showProfileToEveryone` - Profiel publiek zichtbaar
- ✅ `showOnlineStatus` - Online status tonen
- ✅ `allowProfileViews` - Profiel views toestaan
- ✅ `showActivityStatus` - Activiteit status tonen
- ✅ `downloadPermission` - Download toestemming (EVERYONE, FANS_ONLY, FAN_OF_ONLY, ASK_PERMISSION, NOBODY)
- ✅ `printPermission` - Print toestemming (EVERYONE, FANS_ONLY, FAN_OF_ONLY, ASK_PERMISSION, NOBODY)

### UI Component ✅
**Locatie**: `components/profile/PrivacySettings.tsx`

**Status**: ✅ **WERKT** - Alle instellingen zijn zichtbaar en kunnen worden aangepast

### API Endpoint ✅
**Locatie**: `app/api/profile/privacy/route.ts`

**Status**: ✅ **WERKT** - GET en PUT endpoints werken correct met validatie

### Probleem: messagePrivacy wordt NIET gecheckt ❌
**Locatie**: `app/api/conversations/start/route.ts`, `app/api/conversations/start-general/route.ts`

**Probleem**: 
- Bij het starten van een conversatie wordt `messagePrivacy` NIET gecheckt
- Gebruikers kunnen berichten sturen zelfs als `messagePrivacy === 'NOBODY'` of `'FANS_ONLY'`

**Impact**: Privacy instelling wordt genegeerd.

**Fix nodig**: ✅ **JA** - Moet worden toegevoegd bij het starten van conversaties.

### Probleem: downloadPermission & printPermission worden NIET gecheckt ❌
**Locatie**: `components/recipes/RecipeView.tsx`, `components/profile/GardenProjectView.tsx`, `components/designs/DesignView.tsx`

**Probleem**: 
- Download en print knoppen zijn altijd zichtbaar
- Er wordt geen check gedaan of de gebruiker toestemming heeft om te downloaden/printen

**Impact**: Privacy instellingen worden genegeerd.

**Fix nodig**: ✅ **JA** - Moet worden toegevoegd bij download/print functionaliteit.

### Probleem: showOnlineStatus wordt NIET gebruikt ❌
**Locatie**: Overal waar online status wordt getoond

**Probleem**: 
- Er wordt geen check gedaan of `showOnlineStatus === true` voordat online status wordt getoond

**Impact**: Privacy instelling wordt genegeerd.

**Fix nodig**: ✅ **JA** - Moet worden toegevoegd waar online status wordt getoond.

### Probleem: showProfileToEveryone wordt NIET gecheckt ❌
**Locatie**: Profiel pagina's

**Probleem**: 
- Er wordt geen check gedaan of `showProfileToEveryone === true` voordat profiel wordt getoond

**Impact**: Privacy instelling wordt genegeerd.

**Fix nodig**: ✅ **JA** - Moet worden toegevoegd bij profiel weergave.

---

## 3. ACCOUNT INSTELLINGEN ✅

### Wachtwoord wijzigen ✅
**Locatie**: `components/profile/AccountSettings.tsx`

**Status**: ✅ **WERKT** - Validatie en opslaan werkt correct

### Email wijzigen ✅
**Locatie**: `components/profile/AccountSettings.tsx`

**Status**: ✅ **WERKT** - Validatie en opslaan werkt correct

### Account verwijderen ✅
**Locatie**: `components/profile/DeleteAccount.tsx`

**Status**: ✅ **WERKT** - Account verwijdering werkt correct

---

## 4. SAMENVATTING PROBLEMEN

### Kritieke Problemen (Moeten worden gefixt):
1. ❌ **NotificationService.send()** - Checkt alleen `emailNewMessages` in plaats van specifieke email preferences
2. ❌ **messagePrivacy** - Wordt niet gecheckt bij het starten van conversaties
3. ❌ **downloadPermission** - Wordt niet gecheckt bij download functionaliteit
4. ❌ **printPermission** - Wordt niet gecheckt bij print functionaliteit
5. ❌ **showOnlineStatus** - Wordt niet gebruikt waar online status wordt getoond
6. ❌ **showProfileToEveryone** - Wordt niet gecheckt bij profiel weergave

### Werkt Correct:
- ✅ Database schema voor alle instellingen
- ✅ UI componenten voor alle instellingen
- ✅ API endpoints voor opslaan/laden instellingen
- ✅ Account instellingen (wachtwoord, email, verwijderen)
- ✅ Quiet hours functionaliteit
- ✅ Chat notificatie preferences (pushNewMessages, emailNewMessages)

---

## 5. AANBEVOLEN FIXES

### Fix 1: NotificationService.send() - Email Preferences
Per notificatie type de juiste preference checken in plaats van alleen `emailNewMessages`.

### Fix 2: messagePrivacy Check
Toevoegen bij `app/api/conversations/start/route.ts` en `app/api/conversations/start-general/route.ts`.

### Fix 3: Download/Print Permissions
Toevoegen bij RecipeView, GardenProjectView, en DesignView componenten.

### Fix 4: showOnlineStatus
Toevoegen waar online status wordt getoond.

### Fix 5: showProfileToEveryone
Toevoegen bij profiel weergave.








