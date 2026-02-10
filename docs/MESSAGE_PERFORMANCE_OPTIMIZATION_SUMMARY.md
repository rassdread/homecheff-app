# Berichten Prestatie Optimalisatie Samenvatting

## Probleem
De berichten laden langzaam omdat:
1. Te veel database queries bij het laden van berichten
2. Geen caching in de hoofdroute (`/messages`)
3. Complexe joins voor participant data
4. Geen pagination optimalisatie
5. Encryptie overhead bij elke bericht
6. Polling backup te frequent (2 seconden)

## Implementeerde Optimalisaties

### 1. **Nieuwe Snelle API Routes**
- **`/api/conversations/[conversationId]/messages-fast`** - Geoptimaliseerde berichten API
- **`/api/conversations-fast`** - Geoptimaliseerde conversaties API

### 2. **Database Query Optimalisaties**
- **Selective field loading**: Alleen essentiële velden ophalen
- **Skip encrypted messages**: Voor snellere loading (aparte route voor encryptie)
- **Optimized joins**: Minimale participant data
- **Better indexing**: Composite indexes voor veelgebruikte queries

### 3. **Caching Implementatie**
- **In-memory cache**: 15-30 seconden cache voor berichten en conversaties
- **Cache headers**: Client-side caching met `Cache-Control`
- **Cache invalidation**: Automatische cleanup van oude cache entries

### 4. **Polling Optimalisaties**
- **Reduced frequency**: 10 seconden wanneer Pusher verbonden, 5 seconden anders
- **Smart fallbacks**: Automatische fallback naar reguliere API bij fouten

### 5. **Database Indexes**
```sql
-- Composite indexes voor betere performance
CREATE INDEX "idx_message_conversation_read" 
ON "Message" ("conversationId", "readAt", "createdAt" DESC);

CREATE INDEX "idx_message_unread_by_user" 
ON "Message" ("senderId", "readAt", "createdAt" DESC) 
WHERE "readAt" IS NULL;

CREATE INDEX "idx_conversation_participant_user_hidden" 
ON "ConversationParticipant" ("userId", "isHidden", "conversationId");

CREATE INDEX "idx_message_encryption_status" 
ON "Message" ("conversationId", "isEncrypted", "createdAt" DESC);
```

### 6. **Component Optimalisaties**
- **ChatBox**: Gebruikt snelle API met fallback
- **ConversationsList**: Cache-optimized loading
- **Error handling**: Graceful fallbacks naar reguliere API's

## Veiligheid & Opmaak Behouden

### ✅ **Veiligheid**
- Alle participant validaties blijven intact
- Encryptie functionaliteit behouden (aparte route)
- Access control checks ongewijzigd
- Watermark validaties behouden

### ✅ **Opmaak**
- Alle UI componenten ongewijzigd
- Real-time updates via Pusher blijven werken
- Message styling en layout intact
- Typing indicators en online status behouden

## Prestatie Verbeteringen

### **Verwachte Verbeteringen:**
- **50-70% snellere** berichten loading
- **30-40% minder** database queries
- **Cache hits** voor herhaalde requests
- **Betere indexen** voor complexe queries

### **Monitoring:**
- Cache hit/miss headers in responses
- Performance logging in console
- Database query timing
- Index usage statistics

## Implementatie Stappen

### 1. **Database Indexes Toevoegen**
```bash
node scripts/optimize-message-performance.js
```

### 2. **Test Performance**
```bash
node scripts/test-message-performance.js
```

### 3. **Deploy Changes**
De volgende bestanden zijn geoptimaliseerd:
- `app/api/conversations/[conversationId]/messages/route.ts`
- `app/api/conversations/[conversationId]/messages-fast/route.ts` (nieuw)
- `app/api/conversations/route-fast.ts` (nieuw)
- `components/chat/ChatBox.tsx`
- `components/chat/ConversationsList.tsx`
- `app/api/notifications/route.ts`

## Fallback Strategie

Als de snelle API's falen:
1. **Automatische fallback** naar reguliere API's
2. **Error logging** voor debugging
3. **Graceful degradation** zonder functionaliteit verlies
4. **User experience** blijft intact

## Monitoring & Debugging

### **Console Logs:**
- `[Messages API OPTIMIZED]` - Snelle API logs
- `[Conversations API FAST]` - Snelle conversaties logs
- Cache hit/miss indicators
- Performance timing

### **Response Headers:**
- `X-Cache: HIT/MISS` - Cache status
- `Cache-Control` - Caching instructies

## Resultaat

De berichten zouden nu **significant sneller** moeten laden terwijl alle veiligheid en opmaak behouden blijft. De optimalisaties zijn backward-compatible en hebben automatische fallbacks voor robuustheid.
