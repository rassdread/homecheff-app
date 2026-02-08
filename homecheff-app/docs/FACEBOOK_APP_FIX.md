# Facebook Login Fix - Developer Console Configuratie

## 🚨 Probleem
Facebook toont: "Stop! Dit is een browserfunctie die is bedoeld voor ontwikkelaars..."

## ✅ Oplossing - Facebook Developer Console

### 1. **Ga naar Facebook Developer Console**
- https://developers.facebook.com/
- Klik op je app

### 2. **App Settings > Basic**
Controleer:
- **App ID**: `process.env.FACEBOOK_CLIENT_ID`
- **App Secret**: `process.env.FACEBOOK_CLIENT_SECRET`
- **App Domains**: Voeg toe:
  ```
  homecheff.nl
  www.homecheff.nl
  homecheff-app.vercel.app
  localhost (voor development)
  ```

### 3. **Products > Facebook Login > Settings**
**Valid OAuth Redirect URIs** - Voeg toe:
```
https://homecheff.nl/api/auth/callback/facebook
https://www.homecheff.nl/api/auth/callback/facebook
https://homecheff-app.vercel.app/api/auth/callback/facebook
http://localhost:3000/api/auth/callback/facebook
```

### 4. **App Review**
- Ga naar **App Review**
- Zet je app op **"Live"** mode (niet Development)
- Voeg **Privacy Policy URL** toe:
  ```
  https://homecheff.nl/privacy
  ```

### 5. **App Dashboard**
- **App Mode**: Zet op **"Live"** 
- **Privacy Policy URL**: `https://homecheff.nl/privacy`
- **Terms of Service URL**: `https://homecheff.nl/terms`

### 6. **Facebook Login Permissions**
Zorg dat deze permissions zijn toegevoegd:
- `email`
- `public_profile`

### 7. **Test de configuratie**
Na alle wijzigingen:
1. Wacht 5-10 minuten (Facebook cache)
2. Test op: https://homecheff.nl/login
3. Klik op "Inloggen met Facebook"

## 🔍 Debug Tips
Als het nog steeds niet werkt:
- Controleer browser console voor errors
- Test met incognito/private browsing
- Verwijder Facebook cookies en probeer opnieuw
- Controleer of alle URLs exact matchen (geen trailing slashes)

## 📝 Environment Variables
Zorg dat deze in Vercel staan:
```
FACEBOOK_CLIENT_ID=your_app_id
FACEBOOK_CLIENT_SECRET=your_app_secret
NEXTAUTH_URL=https://homecheff.nl
```
