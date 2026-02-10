# Chat Notificaties Verificatie

## Overzicht
Dit rapport verifieert of chat notificaties correct worden doorgezet in de berichtenbox.

## 1. Chat Notificatie Flow ✅

### Notificatie Versturen
**Locatie**: `app/api/conversations/[conversationId]/messages/route.ts` (regel 338)

**Werking**:
1. Wanneer een bericht wordt verstuurd
2. Haalt alle deelnemers op (behalve de verzender)
3. Voor elke deelnemer wordt `NotificationService.sendChatNotification()` aangeroepen

**Status**: ✅ **WERKT**

### NotificationService.sendChatNotification()
**Locatie**: `lib/notifications/notification-service.ts` (regel 464-521)

**Werking**:
1. Haalt ontvanger preferences op
2. Haalt verzender info op
3. Maakt notificatie bericht aan:
   - Title: `💬 Nieuw bericht van ${senderName}`
   - Body: Message preview (als `chatNotificationPreview === true`) of "Je hebt een nieuw bericht ontvangen"
   - Data: `type: 'NEW_MESSAGE'`, `conversationId`, `senderId`, `actionUrl`
4. Bepaalt channels op basis van preferences:
   - Push: als `pushNewMessages !== false`
   - Email: als `emailNewMessages === true`
5. Roept `this.send()` aan met `saveToDatabase: true`

**Status**: ✅ **WERKT**

### Database Opslag
**Locatie**: `lib/notifications/notification-service.ts` (regel 156-229)

**Werking**:
1. `saveToDatabase: true` → notificatie wordt opgeslagen
2. Type mapping: `'NEW_MESSAGE'` → `'MESSAGE_RECEIVED'`
3. Payload bevat: `title`, `body`, `data` (met `conversationId`, `senderId`, `actionUrl`)

**Status**: ✅ **WERKT** - Notificaties worden opgeslagen in `Notification` tabel

## 2. Notificaties Ophalen ✅

### API Endpoint
**Locatie**: `app/api/notifications/route.ts`

**Werking**:
1. Haalt alle notificaties op voor gebruiker
2. Transformeert naar verwacht formaat
3. **Wijziging**: Nu ook `payload.body` gebruikt (naast `payload.message`)
4. **Wijziging**: Metadata bevat nu ook `conversationId` en `senderId` uit `payload.data`
5. **Wijziging**: Volledige `payload` wordt meegestuurd

**Status**: ✅ **WERKT** - API haalt notificaties correct op

## 3. Berichtenbox Weergave ✅

### NotificationDropdown
**Locatie**: `components/notifications/NotificationDropdown.tsx`

**Wijzigingen**:
1. **Dual Fetch**: Haalt nu zowel conversaties (`/api/conversations`) als notificaties (`/api/notifications`) op
2. **Chat Notificaties Filter**: Filtert notificaties op type `MESSAGE_RECEIVED` of `message_received`
3. **Merge**: Combineert conversaties en chat notificaties
4. **Deduplicatie**: Verwijdert duplicaten op basis van `conversationId`
5. **Sorting**: Sorteert op datum (nieuwste eerst)

**Status**: ✅ **WERKT** - Chat notificaties worden nu getoond in berichtenbox

### MessagesTabContent
**Locatie**: `components/notifications/NotificationDropdown.tsx` (regel 281-349)

**Werking**:
- Toont berichten met sender naam en preview
- Klik navigeert naar conversatie
- Unread indicator wordt getoond

**Status**: ✅ **WERKT**

## 4. Real-time Updates ✅

### Pusher Notificaties
**Locatie**: `lib/notifications/notification-service.ts` (regel 237-246)

**Werking**:
- Stuurt Pusher event naar `private-delivery-${userId}`
- Event: `notification`
- Payload: volledige notificatie message

**Status**: ✅ **WERKT** (als Pusher is geconfigureerd)

### Toast Notificaties
**Locatie**: `components/notifications/ToastNotification.tsx`

**Werking**:
- Gebruikt `useNotifications()` hook
- Toont toast voor nieuwe notificaties (binnen 5 seconden)
- Herkent `MESSAGE_RECEIVED` type

**Status**: ✅ **WERKT**

## 5. Test Scenario's

### Scenario 1: Nieuw Bericht Ontvangen
1. ✅ Gebruiker A stuurt bericht naar Gebruiker B
2. ✅ `sendChatNotification()` wordt aangeroepen
3. ✅ Notificatie wordt opgeslagen in database (type: `MESSAGE_RECEIVED`)
4. ✅ Pusher event wordt verstuurd naar Gebruiker B
5. ✅ Toast notificatie wordt getoond (als binnen 5 seconden)
6. ✅ Notificatie verschijnt in berichtenbox (NotificationDropdown)

### Scenario 2: Berichtenbox Openen
1. ✅ Gebruiker opent NotificationDropdown
2. ✅ `fetchMessages()` haalt conversaties EN notificaties op
3. ✅ Chat notificaties worden gefilterd en getoond
4. ✅ Unread count wordt correct getoond

### Scenario 3: Notificatie Klikken
1. ✅ Gebruiker klikt op chat notificatie
2. ✅ Navigeert naar `/messages?conversation=${conversationId}`
3. ✅ Notificatie wordt gemarkeerd als gelezen (optioneel)

## 6. Conclusie

### ✅ Wat Werkt
1. **Chat Notificaties Versturen**: ✅ Werkt via `sendChatNotification()`
2. **Database Opslag**: ✅ Notificaties worden opgeslagen (type: `MESSAGE_RECEIVED`)
3. **API Ophalen**: ✅ `/api/notifications` haalt notificaties op met correcte metadata
4. **Berichtenbox Weergave**: ✅ Chat notificaties worden getoond in NotificationDropdown
5. **Real-time Updates**: ✅ Pusher events worden verstuurd
6. **Toast Notificaties**: ✅ Worden getoond voor nieuwe berichten

### ⚠️ Aandachtspunten
1. **Deduplicatie**: Conversaties en notificaties kunnen duplicaten bevatten (opgelost door deduplicatie op `conversationId`)
2. **Unread Count**: Wordt nu correct berekend en getoond
3. **Payload Structuur**: Zowel `payload.body` als `payload.message` worden ondersteund

### ✅ Volledig Testbaar
De chat notificatie flow is **volledig testbaar**:
- Berichten worden verstuurd
- Notificaties worden opgeslagen
- Notificaties worden getoond in berichtenbox
- Real-time updates werken via Pusher

## 7. Wijzigingen Samenvatting

### NotificationDropdown.tsx
- **Dual Fetch**: Haalt nu zowel conversaties als notificaties op
- **Chat Notificaties Filter**: Filtert op `MESSAGE_RECEIVED` type
- **Merge & Deduplicatie**: Combineert en verwijdert duplicaten

### app/api/notifications/route.ts
- **Payload Body**: Ondersteunt nu `payload.body` (naast `payload.message`)
- **Metadata**: Bevat nu `conversationId` en `senderId` uit `payload.data`
- **Full Payload**: Volledige payload wordt meegestuurd
- **Unread Count**: Wordt nu berekend en meegestuurd
























