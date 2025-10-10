# Chat Functionaliteit Test Guide

## 🧪 Snelle Test Procedure

### Voorbereiding
1. **Start de development server:**
   ```bash
   npm run dev
   ```

2. **Zorg dat je twee accounts hebt:**
   - Account A (Verkoper)
   - Account B (Koper)

### Test Scenario 1: Chat vanaf Product

**Stappen:**
1. Log in als Account B (Koper)
2. Navigeer naar een product van Account A
3. Klik op "Start chat" knop
4. Selecteer een snel bericht OF typ een eigen bericht
5. Klik "Verstuur"
6. Je wordt doorgestuurd naar `/messages?conversation={id}`
7. Controleer of je de chat ziet

**Verwacht Resultaat:**
- ✅ Chat opent automatisch
- ✅ Eerste bericht is zichtbaar
- ✅ Product info zichtbaar in gesprekkenlijst
- ✅ Real-time status indicator toont "Online"

### Test Scenario 2: Berichten Verzenden

**Stappen:**
1. In open chat venster
2. Typ een bericht in het input veld
3. Druk op Enter of klik op verzend knop
4. Wacht 1-2 seconden

**Verwacht Resultaat:**
- ✅ Bericht verschijnt instant in UI (optimistisch)
- ✅ Bericht krijgt timestamp
- ✅ Geen error messages
- ✅ Input veld wordt geleegd
- ✅ Auto-scroll naar nieuw bericht

### Test Scenario 3: Real-time Ontvangen

**Stappen:**
1. Open chat als Account B in één browser/tab
2. Open dezelfde chat als Account A in andere browser/incognito
3. Verstuur bericht als Account A
4. Check of bericht verschijnt bij Account B

**Verwacht Resultaat:**
- ✅ Bericht verschijnt binnen 2 seconden (via Pusher)
- ✅ OF binnen 5 seconden (via fallback polling)
- ✅ Avatar en naam van verzender correct
- ✅ Timestamp klopt
- ✅ Auto-scroll naar nieuw bericht

### Test Scenario 4: Responsive Design

**Mobile Test (< 1024px):**
1. Open `/messages` op mobile viewport
2. Zie gesprekkenlijst fullscreen
3. Klik op een gesprek
4. Chat opent fullscreen
5. Klik terug knop (← icoon)
6. Terug naar gesprekkenlijst

**Desktop Test (≥ 1024px):**
1. Open `/messages` op desktop viewport
2. Zie gesprekkenlijst (384px) + welkomst bericht
3. Klik op een gesprek
4. Chat opent naast gesprekkenlijst
5. Beide blijven zichtbaar

**Verwacht Resultaat:**
- ✅ Smooth transitions
- ✅ Geen layout shifts
- ✅ Alle elementen blijven klikbaar
- ✅ Tekst blijft leesbaar

### Test Scenario 5: Gesprekkenlijst

**Stappen:**
1. Navigeer naar `/messages`
2. Bekijk de lijst van gesprekken
3. Check laatste bericht preview
4. Check timestamps
5. Check unread indicators

**Verwacht Resultaat:**
- ✅ Gesprekken gesorteerd op laatste activiteit
- ✅ Laatste bericht preview zichtbaar
- ✅ "Jij:" prefix voor eigen berichten
- ✅ Relatieve tijd ("Nu", "5m", "2u")
- ✅ Blauwe dot voor ongelezen berichten
- ✅ Product thumbnail waar van toepassing

### Test Scenario 6: Error Handling

**Test A - Geen Internet:**
1. Open chat
2. Disconnect internet
3. Probeer bericht te verzenden
4. Check error message
5. Herconnect internet
6. Check of bericht nog in input staat

**Test B - Sessie Verlopen:**
1. Open chat
2. Clear cookies/logout in andere tab
3. Probeer bericht te verzenden
4. Check of je naar login wordt gestuurd

**Verwacht Resultaat:**
- ✅ Duidelijke error messages in NL
- ✅ Geen crashes
- ✅ Bericht blijft behouden in input
- ✅ Graceful redirect naar login bij auth error

### Test Scenario 7: Lege States

**Test A - Geen Gesprekken:**
1. Log in met nieuw account
2. Navigeer naar `/messages`
3. Check lege state

**Test B - Geen Berichten:**
1. Start nieuwe chat
2. Verstuur nog geen bericht
3. Check lege state in chat venster

**Verwacht Resultaat:**
- ✅ Vriendelijke lege state met emoji
- ✅ Duidelijke instructies
- ✅ Geen error messages
- ✅ UI blijft bruikbaar

### Test Scenario 8: Performance

**Stappen:**
1. Open gesprek met >20 berichten
2. Check scroll performance
3. Verstuur nieuw bericht
4. Check response tijd
5. Open DevTools Network tab
6. Check aantal API calls

**Verwacht Resultaat:**
- ✅ Smooth scrolling (60fps)
- ✅ Bericht verstuurd in < 500ms
- ✅ Pusher updates in < 100ms
- ✅ Fallback polling max 1x per 5 sec
- ✅ Geen onnodige API calls
- ✅ Efficient database queries

## 🔧 Debug Tips

### Check Pusher Connection
Open browser console en zoek naar:
```
[OptimizedChat] 🔌 Setting up Pusher...
[OptimizedChat] ✅ Pusher connected
```

Als je fallback polling ziet:
```
[OptimizedChat] 🔄 Falling back to polling...
```
→ Check Pusher credentials in `.env.local`

### Check API Responses
In Network tab, check:
- `/api/conversations` - Lijst ophalen
- `/api/conversations/[id]/messages` - Berichten ophalen
- POST `/api/conversations/[id]/messages` - Bericht versturen

### Check Console Errors
Kijk uit voor:
- ❌ 401 Unauthorized → Sessie probleem
- ❌ 403 Forbidden → Geen toegang tot conversatie
- ❌ 500 Internal Server Error → Server/database probleem
- ❌ Pusher connection failed → Credentials probleem

## 📊 Performance Benchmarks

### Target Metrics
- **Initial Load**: < 1 second
- **Message Send**: < 500ms
- **Real-time Delivery**: < 100ms (Pusher) / < 5s (Polling)
- **Scroll FPS**: 60fps
- **Database Queries**: < 100ms

### Tools
- Chrome DevTools Performance tab
- Network tab (disable cache)
- React DevTools Profiler
- Lighthouse audit

## ✅ Acceptatie Criteria

De chat functionaliteit is succesvol als:

1. ✅ **Basis Chat Werkt**
   - Berichten kunnen verzonden en ontvangen worden
   - Chat opent correct vanaf product
   - Gesprekkenlijst toont alle actieve chats

2. ✅ **Real-time Functionaliteit**
   - Pusher werkt of fallback is actief
   - Berichten verschijnen binnen 5 seconden
   - Geen handmatige refresh nodig

3. ✅ **Responsive Design**
   - Werkt op mobile (< 768px)
   - Werkt op tablet (768-1024px)
   - Werkt op desktop (> 1024px)
   - Smooth transitions tussen viewports

4. ✅ **Error Handling**
   - Geen crashes bij netwerk errors
   - Duidelijke error messages in Nederlands
   - Graceful degradation

5. ✅ **Performance**
   - Geen merkbare lag bij typen
   - Smooth scrolling
   - Snelle message delivery
   - Efficient database gebruik

6. ✅ **UX Quality**
   - Intuïtieve navigatie
   - Duidelijke visual feedback
   - Geen verwarrende states
   - Professioneel uiterlijk

## 🐛 Problemen Oplossen

### "Pusher not connected"
```bash
# Check .env.local
NEXT_PUBLIC_PUSHER_KEY=your_key
NEXT_PUBLIC_PUSHER_CLUSTER=eu
PUSHER_APP_ID=your_app_id
PUSHER_SECRET=your_secret
```

### "Database connection failed"
```bash
# Check DATABASE_URL
DATABASE_URL="postgresql://..."

# Test connection
npx prisma db pull
```

### "Session expired"
```bash
# Clear cookies en login opnieuw
# Of check NEXTAUTH_SECRET in .env.local
```

### "Messages not loading"
```bash
# Check browser console voor errors
# Check Network tab voor failed requests
# Check server logs
```

## 📈 Volgende Test Fase

Na succesvolle basis tests:

1. **Load Testing**
   - 10+ gelijktijdige gebruikers
   - 100+ berichten per conversatie
   - Multiple active conversations

2. **Security Testing**
   - SQL injection attempts
   - XSS attempts
   - CSRF protection
   - Access control validation

3. **Accessibility Testing**
   - Keyboard navigation
   - Screen reader compatibility
   - Color contrast
   - Focus management

4. **Browser Compatibility**
   - Chrome, Firefox, Safari, Edge
   - Mobile browsers (iOS Safari, Chrome Android)
   - Different viewport sizes

---

**Happy Testing! 🎉**

Als je bugs vindt, documenteer ze met:
- Stappen om te reproduceren
- Verwacht vs daadwerkelijk gedrag
- Screenshots/video indien mogelijk
- Browser + versie info
- Console errors

