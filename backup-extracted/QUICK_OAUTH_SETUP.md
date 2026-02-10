# ⚡ Quick OAuth Setup Guide

## 🔵 Facebook OAuth Setup (5 minuten)

### Stap 1: Ga naar Facebook Developer Console
👉 https://developers.facebook.com/apps/775438988657902/settings/basic/

### Stap 2: Facebook Login Settings
1. **Klik op "Facebook Login"** in het linker menu
2. **Klik op "Settings"**
3. **Voeg toe onder "Valid OAuth Redirect URIs"**:
   ```
   http://localhost:3003/api/auth/callback/facebook
   https://homecheff-8xucfg5gu-sergio-s-projects-f7b64ee1.vercel.app/api/auth/callback/facebook
   ```
4. **Klik "Save Changes"**

### Stap 3: Basic Settings
1. **Ga terug naar "Settings" → "Basic"**
2. **Scroll naar "App Domains"**
3. **Voeg toe**:
   ```
   localhost
   homecheff-8xucfg5gu-sergio-s-projects-f7b64ee1.vercel.app
   ```
4. **Klik "Save Changes"**

### Stap 4: Maak App Live (BELANGRIJK!)
1. **Bovenaan zie je een toggle**: "App Mode: Development" of "In Development"
2. **Klik op de toggle** om de app **LIVE** te maken
3. Als je gevraagd wordt om een Privacy Policy URL:
   ```
   https://homecheff-8xucfg5gu-sergio-s-projects-f7b64ee1.vercel.app/privacy
   ```

---

## 🔴 Google OAuth Setup (3 minuten)

### Stap 1: Ga naar Google Cloud Console
👉 https://console.cloud.google.com/apis/credentials

### Stap 2: Selecteer je OAuth Client
1. **Zoek je client**: "615612462371-r5ntdobrn3rtc01nckhpajdsrr6s4qd7"
2. **Klik erop om te bewerken**

### Stap 3: Voeg Redirect URIs toe
1. **Scroll naar "Authorized redirect URIs"**
2. **Klik "ADD URI"** en voeg toe:
   ```
   http://localhost:3003/api/auth/callback/google
   ```
3. **Klik nogmaals "ADD URI"** en voeg toe:
   ```
   https://homecheff-8xucfg5gu-sergio-s-projects-f7b64ee1.vercel.app/api/auth/callback/google
   ```
4. **Klik "SAVE"**

### Stap 4: OAuth Consent Screen (Check)
1. **Ga naar "OAuth consent screen"** in het linker menu
2. **Controleer dat deze ingesteld zijn**:
   - **App name**: HomeCheff
   - **User support email**: Je email
   - **Scopes**: `email`, `profile`, `openid`
   - **Authorized domains**: `homecheff-8xucfg5gu-sergio-s-projects-f7b64ee1.vercel.app`

---

## 🎯 Test Plan

### Test 1: Google Login (Lokaal)
1. Ga naar: http://localhost:3003/login
2. Klik op "Inloggen met Google"
3. Selecteer je Google account
4. Check of je doorgestuurd wordt naar `/register?social=true`
5. Controleer dat het registratieformulier vooraf ingevuld is met je Google-gegevens

### Test 2: Facebook Login (Lokaal)
1. Ga naar: http://localhost:3003/login
2. Klik op "Inloggen met Facebook"
3. Log in met Facebook
4. Check of je doorgestuurd wordt naar `/register?social=true`
5. Controleer dat het registratieformulier vooraf ingevuld is met je Facebook-gegevens

### Test 3: Profiel Check
1. Ga naar: http://localhost:3003/profile
2. Check of al je informatie correct is:
   - ✅ Profielfoto (van Google/Facebook)
   - ✅ Naam
   - ✅ Email
   - ✅ Username (automatisch gegenereerd)
   - ✅ Bio (standaard bericht)

### Test 4: Chat Functionaliteit
1. **Open 2 browsers** (bijv. Chrome en Firefox)
2. **Browser 1**: Log in met Google account
3. **Browser 2**: Log in met Facebook account (of andere Google account)
4. **Browser 1**: Ga naar een product en start chat met verkoper
5. **Browser 2**: Open `/messages` en zie nieuwe chat
6. **Test**: Verzend berichten heen en weer
7. **Check**: Real-time updates werken (zonder pagina refresh)

---

## 🐛 Troubleshooting

### Facebook Login werkt niet
**Error**: "redirect_uri_mismatch"
- ✅ Check of redirect URI **exact** overeenkomt (inclusief `/api/auth/callback/facebook`)
- ✅ Check of app **LIVE** is (niet in Development mode)
- ✅ Check of domain toegevoegd is onder "App Domains"

### Google Login werkt niet
**Error**: "redirect_uri_mismatch"
- ✅ Check of redirect URI **exact** overeenkomt (inclusief `/api/auth/callback/google`)
- ✅ Check of OAuth consent screen gepubliceerd is

### Profielfoto wordt niet opgehaald
- ✅ Check browser console voor errors
- ✅ Check of `image` field in database gevuld is
- ✅ Check network tab voor image load errors

### Chat berichten komen niet aan
- ✅ Check Pusher keys in `.env`
- ✅ Check browser console voor Pusher connection errors
- ✅ Check of beide gebruikers in dezelfde conversation zitten
- ✅ Check of Pusher App ID correct is (2061876)

---

## 📊 Browser Console Checks

Open browser console (F12) en check voor deze logs:

### Bij Social Login:
```
🔍 Social login data: {provider: "google", userEmail: "...", ...}
✅ New social user created: {id: "...", email: "...", username: "..."}
```

### Bij Chat:
```
[Pusher] ✅ Message sent to conversation-xxx
[OptimizedChat] 📨 New message via Pusher: {id: "...", text: "...", ...}
```

### Bij Homepage:
```
🏠 HomePage session status: {status: "authenticated", hasSession: true, ...}
```

---

## ✅ Final Checklist

Nadat je alles hebt ingesteld:

- [ ] Facebook redirect URIs toegevoegd
- [ ] Facebook app is LIVE (niet Development)
- [ ] Google redirect URIs toegevoegd
- [ ] Alle 17 environment variables in Vercel
- [ ] Google login werkt lokaal
- [ ] Facebook login werkt lokaal
- [ ] Profielfoto's worden opgehaald
- [ ] Chat real-time werkt
- [ ] Deploy naar Vercel
- [ ] Google login werkt op productie
- [ ] Facebook login werkt op productie
- [ ] Chat werkt op productie

---

## 🚀 Deploy naar Vercel

Zodra alles lokaal werkt:

```bash
git add .
git commit -m "✨ Add Google & Facebook OAuth + Pusher chat"
git push origin main
```

Vercel deployt automatisch binnen 2-3 minuten! 🎉

---

**Heb je nog problemen? Check de console logs! 🔍**

