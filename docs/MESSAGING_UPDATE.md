# Messaging Systeem Update - HomeCheff

## Wat is er veranderd? 🔄

### 1. **ProfessionalMessagesBox verwijderd uit header**
   - Het icoon met dropdown in de header is verwijderd
   - Dit voorkomt verwarring met twee verschillende berichtensystemen

### 2. **Nieuwe Messages tab in Profiel**
   - Een volledige "Berichten" tab is toegevoegd aan de profiel pagina
   - Te bereiken via: `/profile?tab=messages`
   - Toont ongelezen berichten badge in de tab

### 3. **Geïntegreerde Chat Functionaliteit**
   - Gebruikt de bestaande `ConversationsList` en `ChatWindow` componenten
   - Real-time messaging via Socket.io
   - Automatische updates van ongelezen berichten

### 4. **Geüpdatete Navigatie**
   - Berichten link in dropdown menu wijst nu naar profiel
   - Mobile menu berichten link wijst ook naar profiel
   - URL parameter support: `?tab=messages` opent automatisch de juiste tab

## Componenten Structuur 📁

```
components/
├── chat/
│   ├── ConversationsList.tsx     # Lijst met gesprekken
│   ├── ChatWindow.tsx            # Chat venster met real-time updates
│   ├── MessageList.tsx           # Berichten weergave
│   ├── MessageInput.tsx          # Bericht invoer
│   └── MessageEncryption.tsx     # Optionele encryptie
│
├── profile/
│   ├── ProfileClient.tsx         # Main profiel met tabs (UPDATED)
│   └── ProfileMessages.tsx       # Nieuwe Messages tab component (NEW)
│
└── NavBar.tsx                    # Navigatie (UPDATED - icoon verwijderd)
```

## API Routes 🔗

Bestaande routes die worden gebruikt:
- `GET /api/conversations` - Haal alle gesprekken op
- `GET /api/conversations/[id]/messages` - Haal berichten in een gesprek op
- `GET /api/messages/unread-count` - Tel ongelezen berichten
- `PUT /api/messages/[id]/read` - Markeer bericht als gelezen
- `WS /api/socket` - WebSocket voor real-time updates

## Real-time Functionaliteit ⚡

### Socket.io Events:
- `join-conversation` - Deelnemen aan een gesprek
- `leave-conversation` - Verlaten van een gesprek
- `send-message` - Verstuur een bericht
- `new-message` - Ontvang een nieuw bericht
- `typing-start` / `typing-stop` - Typ-indicatoren
- `mark-message-read` - Markeer als gelezen

### Custom Events:
- `messagesRead` - Getriggerd wanneer berichten worden gelezen
- `unreadCountUpdate` - Update ongelezen aantal

## Features ✨

1. **Badge Indicator**: Toont aantal ongelezen berichten op de tab
2. **Auto-refresh**: Berichten worden automatisch bijgewerkt (polling elke 30 seconden)
3. **Real-time**: Directe updates via WebSocket wanneer nieuwe berichten binnenkomen
4. **Responsive**: Werkt op desktop, tablet en mobile
5. **Terug naar lijst**: Eenvoudig navigeren tussen gesprekkenlijst en chat venster
6. **Product Context**: Toont product info als het gesprek over een product gaat
7. **Order Context**: Ondersteunt gesprekken over bestellingen

## Testen 🧪

### Test Scenario's:

1. **Basis Navigatie**
   - [ ] Ga naar profiel via navbar
   - [ ] Klik op "Berichten" tab
   - [ ] Verifieer dat gesprekken worden geladen

2. **Ongelezen Badge**
   - [ ] Verstuur een bericht naar je eigen account (via andere user)
   - [ ] Check of de badge verschijnt op de Messages tab
   - [ ] Open het gesprek en verifieer dat badge verdwijnt

3. **Real-time Messaging**
   - [ ] Open twee browsers (verschillende users)
   - [ ] Start een gesprek
   - [ ] Verstuur berichten heen en weer
   - [ ] Verifieer dat berichten direct verschijnen

4. **Link in Navbar**
   - [ ] Klik op "Berichten" in dropdown menu
   - [ ] Verifieer dat je naar `/profile?tab=messages` gaat
   - [ ] Check dat de Messages tab actief is

5. **Mobile Experience**
   - [ ] Test op mobiel formaat
   - [ ] Verifieer dat chat window full-screen is
   - [ ] Test terug-knop functionaliteit

6. **Conversation Types**
   - [ ] Test gesprek over een product
   - [ ] Test gesprek over een bestelling
   - [ ] Test algemeen gesprek

## Benodigde Environment Variables 🔧

Zorg dat deze aanwezig zijn in je `.env`:

```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000  # Of je productie URL
NEXTAUTH_URL=http://localhost:3000             # Voor CORS in Socket.io
```

## Troubleshooting 🔍

### Socket.io verbindt niet:
1. Check of `pages/api/socket.ts` bestaat
2. Verifieer dat de server draait
3. Check browser console voor errors
4. Probeer de pagina te refreshen

### Berichten worden niet geladen:
1. Check API routes in Network tab
2. Verifieer authenticatie (moet ingelogd zijn)
3. Check console voor errors

### Badge update niet:
1. Verifieer dat `unreadCountUpdate` event wordt verstuurd
2. Check of `onUnreadCountChange` callback wordt aangeroepen
3. Refresh de pagina

## Volgende Stappen 🚀

Mogelijke toekomstige verbeteringen:
- [ ] Push notificaties voor nieuwe berichten
- [ ] Geluid bij nieuwe berichten
- [ ] Typing indicators in real-time
- [ ] Bericht zoeken functionaliteit
- [ ] Archiveren van oude gesprekken
- [ ] Groepsgesprekken ondersteuning
- [ ] Emoji picker
- [ ] Bestand upload in berichten

## Gewijzigde Bestanden 📝

1. `components/NavBar.tsx` - Verwijderd ProfessionalMessagesBox
2. `components/profile/ProfileClient.tsx` - Toegevoegd Messages tab
3. `components/profile/ProfileMessages.tsx` - NIEUW component
4. Geen database wijzigingen nodig - gebruikt bestaande schema

---

**Status**: ✅ Voltooid en klaar voor testen
**Socket.io**: ✅ Geïmplementeerd en actief
**API Routes**: ✅ Alle routes beschikbaar
**Real-time**: ✅ WebSocket communicatie werkend

