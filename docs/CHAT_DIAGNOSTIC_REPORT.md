# Chat Functie Diagnostic Report

## 🔍 Gevonden Problemen (Opgelost)

### 1. ✅ Dubbele API Routes - OPGELOST
**Probleem**: Er waren twee verschillende endpoints voor het verzenden van berichten:
- ❌ `/api/messages/send/route.ts` - Oude route zonder Pusher
- ✅ `/api/conversations/[conversationId]/messages/route.ts` - Correcte route met Pusher

**Oplossing**: 
- Dubbele route `/api/messages/send/route.ts` verwijderd
- Alleen de correcte route blijft actief

### 2. ✅ PrismaClient Instantiatie - OPGELOST  
**Probleem**: De oude route gebruikte `new PrismaClient()` wat kan leiden tot:
- Te veel database connecties
- Memory leaks
- Inconsistent gedrag

**Oplossing**: Route verwijderd, dus probleem opgelost

---

## ⚠️ Te Controleren

### 3. Pusher Configuratie
De applicatie gebruikt Pusher voor real-time berichten. Controleer of de volgende environment variabelen correct zijn ingesteld:

**In `.env` of `.env.local`:**
```env
# Pusher Server-side (in lib/pusher.ts)
PUSHER_APP_ID=your_app_id
PUSHER_SECRET=your_secret_key
NEXT_PUBLIC_PUSHER_KEY=your_public_key
NEXT_PUBLIC_PUSHER_CLUSTER=eu  # of uw cluster

# De NEXT_PUBLIC_ variabelen zijn ook beschikbaar client-side
```

**Test Pusher configuratie:**
1. Log in op https://dashboard.pusher.com
2. Controleer of je app actief is
3. Kopieer de credentials naar je `.env` file
4. Herstart de development server

---

## 📊 Huidige Chat Architectuur

### Correcte Message Flow:
```
Client (OptimizedChat.tsx) 
    ↓ POST
/api/conversations/[conversationId]/messages
    ↓
1. Validatie (auth, participant check)
2. Optionele encryptie (als ingeschakeld)
3. Database opslag (Prisma)
4. Pusher broadcast → `conversation-{id}` channel
5. Return message naar sender
    ↓
Pusher client (andere gebruikers)
    ↓ 'new-message' event
Update UI automatisch
```

### API Endpoints (Correct):
- ✅ `GET /api/conversations` - Lijst van gesprekken
- ✅ `GET /api/conversations/[id]` - Enkel gesprek
- ✅ `GET /api/conversations/[id]/messages` - Berichten ophalen
- ✅ `POST /api/conversations/[id]/messages` - Bericht versturen
- ✅ `DELETE /api/conversations/[id]/delete` - Gesprek wissen

---

## 🔧 Overige Routes (Behouden)

Deze routes zijn **NIET** dubbel, ze hebben andere functionaliteit:

1. **`/api/messages/route.ts`** - Haalt alle berichten op van de huidige gebruiker (eigen berichten)
2. **`/api/messages/all/route.ts`** - Unified inbox (berichten, follows, reviews, orders, etc.)
3. **`/api/messages/personal/route.ts`** - Persoonlijke berichten
4. **`/api/messages/unread-count/route.ts`** - Telt ongelezen berichten
5. **`/api/messages/encrypt/route.ts`** - Encryptie helper
6. **`/api/messages/decrypt/route.ts`** - Decryptie helper
7. **`/api/messages/[messageId]/read/route.ts`** - Markeer als gelezen

---

## 🧪 Test Checklist

### Basis Functionaliteit:
- [ ] Gesprekken lijst laadt
- [ ] Gesprek opent correct
- [ ] Bestaande berichten worden getoond
- [ ] Nieuw bericht kan verstuurd worden
- [ ] Bericht komt aan bij de verzender (optimistic update)
- [ ] Bericht komt aan bij ontvanger (real-time via Pusher)
- [ ] Read receipts werken (dubbel vinkje)
- [ ] Notificaties verschijnen

### Advanced:
- [ ] Pusher verbinding is online (groene stip)
- [ ] Bij Pusher fout: fallback naar polling werkt
- [ ] Encryptie werkt (als ingeschakeld)
- [ ] Meerdere gesprekken parallel werken
- [ ] Refresh behoudt gesprek

---

## 🐛 Debugging Tips

### Als berichten niet aankomen:

1. **Check Browser Console:**
   ```javascript
   // Kijk naar:
   [OptimizedChat] 📤 Message sent...
   [Messages API POST] ✅ Message created
   [Pusher] ✅ Message sent to conversation-xxx
   [OptimizedChat] 📨 New message via Pusher
   ```

2. **Check Network Tab:**
   - POST naar `/api/conversations/[id]/messages` moet 200 OK zijn
   - Response moet `{ message: {...} }` bevatten

3. **Check Pusher Dashboard:**
   - Ga naar https://dashboard.pusher.com
   - Kijk bij "Debug Console"
   - Zie je events binnenkomen?

4. **Check Environment:**
   ```bash
   # In terminal:
   echo $PUSHER_APP_ID
   echo $NEXT_PUBLIC_PUSHER_KEY
   echo $NEXT_PUBLIC_PUSHER_CLUSTER
   ```

### Als Pusher niet werkt:
- OptimizedChat valt automatisch terug op polling (elke 5 seconden)
- Je ziet: `[OptimizedChat] 🔄 Falling back to polling...`
- Berichten komen dan vertraagd aan

---

## 📝 Code Quality

### Verbeteringen Doorgevoerd:
✅ Dubbele routes verwijderd
✅ Consistent gebruik van shared Prisma instance
✅ Uitgebreide logging voor debugging
✅ Error handling verbeterd
✅ Optimistic UI updates

### Beveiligingen:
✅ Auth checks op alle endpoints
✅ Participant verificatie
✅ Optionele end-to-end encryptie
✅ XSS preventie (escaped output)
✅ Rate limiting potentie (via Pusher)

---

## 🎯 Volgende Stappen

1. **Controleer Pusher credentials in environment**
2. **Herstart development server**
3. **Test bericht verzenden tussen twee accounts**
4. **Monitor browser console en Pusher dashboard**
5. **Rapporteer eventuele errors**

---

## 📞 Support

Bij problemen, check:
1. Browser console logs
2. Server logs (terminal)
3. Pusher dashboard
4. Database (Prisma Studio: `npx prisma studio`)

Gemaakt op: ${new Date().toLocaleString('nl-NL')}

