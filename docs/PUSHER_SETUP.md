# 🔧 Pusher Setup voor HomeCheff Chat

## ✅ Wat is al gefixed:

1. **CSP Headers** - WebSocket verbindingen naar Pusher zijn nu toegestaan
2. **Cookie Errors** - NextAuth cookie prefix errors zijn opgelost
3. **Code configuratie** - Chat gebruikt correct de Pusher environment variabelen

## 🔑 Environment Variables die je moet toevoegen in Vercel:

Ga naar: **Vercel Dashboard** → **homecheff-app** → **Settings** → **Environment Variables**

Voeg deze toe:

```bash
# Pusher Configuration
PUSHER_APP_ID=2061876
NEXT_PUBLIC_PUSHER_KEY=2153aeeaf61d41ad953b
PUSHER_SECRET=681319d5cce17106af1c
NEXT_PUBLIC_PUSHER_CLUSTER=eu
```

### ⚠️ **BELANGRIJK:**
- `NEXT_PUBLIC_PUSHER_KEY` en `NEXT_PUBLIC_PUSHER_CLUSTER` moeten **NEXT_PUBLIC_** prefix hebben!
- Deze worden gebruikt in de frontend (browser)
- `PUSHER_APP_ID` en `PUSHER_SECRET` zijn alleen voor backend

## 📋 Stappen om toe te voegen:

1. **Open Vercel Dashboard**: https://vercel.com/dashboard
2. **Selecteer je project**: homecheff-app
3. **Ga naar Settings** → **Environment Variables**
4. **Voeg één voor één toe:**
   - Name: `PUSHER_APP_ID`, Value: `2061876`, Environment: **Production, Preview, Development** (alle 3)
   - Name: `NEXT_PUBLIC_PUSHER_KEY`, Value: `2153aeeaf61d41ad953b`, Environment: **alle 3**
   - Name: `PUSHER_SECRET`, Value: `681319d5cce17106af1c`, Environment: **alle 3**
   - Name: `NEXT_PUBLIC_PUSHER_CLUSTER`, Value: `eu`, Environment: **alle 3**

5. **Deploy opnieuw** (gebeurt automatisch na env variable toevoegen)

## 🧪 Testen na deploy:

1. **Log in** met twee verschillende accounts (gebruik twee browsers of incognito)
2. **Start een chat** vanaf een product pagina
3. **Verstuur een bericht** - moet **instant** verschijnen bij ontvanger
4. **Check console** - moet zien: `[Pusher] ✅ Message sent to conversation-...`

## 🐛 Troubleshooting:

### Als je nog steeds Pusher errors ziet:
```
Cross-Origin-aanvraag geblokkeerd: ...pusher.com...
```

**Oplossing:** Controleer of de environment variabelen correct zijn ingesteld in Vercel en deploy opnieuw.

### Als berichten niet aankomen:
1. Check browser console voor `[OptimizedChat] 🔌 Setting up Pusher...`
2. Check of `NEXT_PUBLIC_PUSHER_KEY` correct is (moet zichtbaar zijn in browser)
3. Refresh de pagina na het toevoegen van env vars

### Cookie errors blijven verschijnen:
Dit is normaal in **ontwikkeling**. In **productie** op Vercel zou dit niet meer moeten gebeuren na de cookie fix.

## 🚀 Wat er nu werkt:

✅ **Real-time messaging** via Pusher WebSocket  
✅ **Optimistische UI** - bericht verschijnt instant bij zender  
✅ **Fallback naar polling** als Pusher niet werkt (elke 5 sec)  
✅ **Encryption** - alle berichten zijn geëncrypt in database  
✅ **Read receipts** - zie wanneer bericht gelezen is  
✅ **Responsive design** - werkt op mobile én desktop  

## 📱 Chat Features:

- **Instant delivery** met Pusher
- **End-to-end encryption** optioneel per conversation
- **Typing indicators** (al voorbereid in API)
- **Message status** (sent, delivered, read)
- **File attachments** support (image focus)
- **Conversation management** (delete, archive)
- **Unread counts** en notifications

---

**Na het toevoegen van de environment variabelen in Vercel, deploy de app opnieuw en test de chat!**

