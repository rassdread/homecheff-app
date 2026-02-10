# Social Login Setup Guide - homecheff.nl

## 🚨 Probleem
Social login werkt niet na overstap naar `homecheff.nl` domain.

## ✅ Oplossing

### 1. Environment Variabelen Instellen

Maak een `.env.local` bestand in je project root:

```env
# NextAuth Configuration
NEXTAUTH_URL=https://homecheff.nl
NEXTAUTH_SECRET=your-secret-key-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Facebook OAuth  
FACEBOOK_CLIENT_ID=your-facebook-client-id
FACEBOOK_CLIENT_SECRET=your-facebook-client-secret

# Email Service
RESEND_API_KEY=re_CUpW6TtM_HcN73wZUPqXvR9h6cQ9fy4vD

# Database
DATABASE_URL=your-database-url
DIRECT_URL=your-database-url
```

### 2. Google OAuth Configuratie

Ga naar [Google Cloud Console](https://console.developers.google.com/):

1. **Selecteer je project**
2. **Ga naar "Credentials" → "OAuth 2.0 Client IDs"**
3. **Edit je OAuth client**
4. **Authorized JavaScript origins:**
   ```
   https://homecheff.nl
   http://localhost:3000
   ```
5. **Authorized redirect URIs:**
   ```
   https://homecheff.nl/api/auth/callback/google
   http://localhost:3000/api/auth/callback/google
   ```

### 3. Facebook OAuth Configuratie

Ga naar [Facebook Developers](https://developers.facebook.com/):

1. **Selecteer je app**
2. **Ga naar "Facebook Login" → "Settings"**
3. **Valid OAuth Redirect URIs:**
   ```
   https://homecheff.nl/api/auth/callback/facebook
   http://localhost:3000/api/auth/callback/facebook
   ```
4. **App Domains:**
   ```
   homecheff.nl
   localhost
   ```

### 4. Vercel Environment Variabelen

In je Vercel dashboard:

1. **Ga naar je project**
2. **Settings → Environment Variables**
3. **Voeg toe:**

| Name | Value | Environment |
|------|-------|-------------|
| `NEXTAUTH_URL` | `https://homecheff.nl` | Production, Preview |
| `NEXTAUTH_SECRET` | `[jouw-secret-key]` | Production, Preview |
| `GOOGLE_CLIENT_ID` | `[jouw-google-client-id]` | Production, Preview |
| `GOOGLE_CLIENT_SECRET` | `[jouw-google-client-secret]` | Production, Preview |
| `FACEBOOK_CLIENT_ID` | `[jouw-facebook-client-id]` | Production, Preview |
| `FACEBOOK_CLIENT_SECRET` | `[jouw-facebook-client-secret]` | Production, Preview |

## 🔍 Test Status

### ✅ Wat Werkt:
- [x] Server draait op homecheff.nl
- [x] Google provider geconfigureerd
- [x] Facebook provider geconfigureerd
- [x] OAuth callbacks beschikbaar

### ⏳ Te Doen:
- [ ] Environment variabelen instellen
- [ ] Google OAuth URLs updaten
- [ ] Facebook OAuth URLs updaten
- [ ] Testen in productie

## 🧪 Test Commands

```bash
# Test social login configuratie
node test-social-login.js

# Start development server
npm run dev

# Test in browser
# Ga naar: http://localhost:3000/login
# Klik op "Inloggen met Google" of "Inloggen met Facebook"
```

## 🚨 Veelvoorkomende Problemen

### Google Login Werkt Niet:
- Check of `GOOGLE_CLIENT_ID` en `GOOGLE_CLIENT_SECRET` correct zijn
- Verificeer OAuth redirect URIs in Google Console
- Check of `NEXTAUTH_URL` correct is ingesteld

### Facebook Login Werkt Niet:
- Check of `FACEBOOK_CLIENT_ID` en `FACEBOOK_CLIENT_SECRET` correct zijn
- Verificeer OAuth redirect URIs in Facebook Developers
- Check of App Domains correct zijn ingesteld
- Facebook vereist HTTPS in productie

### Beide Werken Niet:
- Check of `NEXTAUTH_SECRET` is ingesteld
- Verificeer alle environment variabelen
- Check browser console voor errors
- Test eerst lokaal, dan productie

## 📞 Support

Voor vragen: support@homecheff.nl

---
**Status:** 🔧 In Progress - Environment variabelen moeten worden ingesteld








