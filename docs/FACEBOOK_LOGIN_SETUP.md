# Facebook Login Setup - Stap voor Stap Gids

## 📋 Overzicht
Deze gids helpt je om Facebook login volledig in te stellen voor homecheff.nl.

---

## 🔧 Stap 1: Facebook Developer Console Configuratie

### 1.1 Ga naar Facebook Developers
- Open: https://developers.facebook.com/
- Log in met je Facebook account
- Klik op "My Apps" → Selecteer je app (of maak een nieuwe aan)

### 1.2 App Settings > Basic
Ga naar: **Settings** → **Basic**

**Controleer/Stel in:**
- **App ID**: Noteer dit nummer (dit is je `FACEBOOK_CLIENT_ID`)
- **App Secret**: Klik op "Show" en noteer dit (dit is je `FACEBOOK_CLIENT_SECRET`)

**App Domains** - Voeg deze toe (één per regel):
```
homecheff.nl
www.homecheff.nl
```

**Privacy Policy URL**:
```
https://homecheff.nl/privacy
```

**Terms of Service URL** (optioneel):
```
https://homecheff.nl/terms
```

**Website**:
```
https://homecheff.nl
```

### 1.3 Facebook Login Use Case Toevoegen
- Ga naar **Use Cases** (of **Products**) in het linker menu
- Zoek "Facebook Login" en klik op **"Set Up"** of **"Add"**
- Als het al is toegevoegd, klik op **"Facebook Login"** → **"Settings"**

### 1.4 Valid OAuth Redirect URIs
Ga naar: **Use Cases** → **Facebook Login** → **Settings** (of **Products** → **Facebook Login** → **Settings**)

**Valid OAuth Redirect URIs** - Voeg deze toe (één per regel):
```
https://homecheff.nl/api/auth/callback/facebook
https://www.homecheff.nl/api/auth/callback/facebook
http://localhost:3000/api/auth/callback/facebook
```

⚠️ **BELANGRIJK**: 
- Geen trailing slashes (`/`) aan het einde
- Exact deze URLs, geen variaties
- Wacht 5-10 minuten na het toevoegen (Facebook cache)

### 1.5 App Mode: Live
- Ga naar **Settings** → **Basic**
- Scroll naar beneden naar **"App Mode"**
- Zet dit op **"Live"** (niet Development)
- Dit is nodig zodat alle gebruikers kunnen inloggen

### 1.6 Permissions Controleren
Ga naar: **Use Cases** → **Facebook Login** → **Permissions and Features** (of **Products** → **Facebook Login** → **Permissions and Features**)

Zorg dat deze permissions zijn toegevoegd:
- ✅ `email` (vereist)
- ✅ `public_profile` (vereist)

---

## 🔑 Stap 2: Vercel Environment Variables

### 2.1 Ga naar Vercel Dashboard
- Open: https://vercel.com/
- Log in en selecteer je project: **homecheff-app**

### 2.2 Ga naar Settings → Environment Variables
- Klik op je project
- Ga naar **Settings** tab
- Klik op **Environment Variables** in het linker menu

### 2.3 Voeg deze variabelen toe:

**Voor Production, Preview EN Development:**

| Key | Value | Environment |
|-----|-------|-------------|
| `FACEBOOK_CLIENT_ID` | [Je App ID uit stap 1.2] | Production, Preview, Development |
| `FACEBOOK_CLIENT_SECRET` | [Je App Secret uit stap 1.2] | Production, Preview, Development |
| `NEXTAUTH_URL` | `https://homecheff.nl` | Production |
| `NEXTAUTH_URL` | `https://homecheff-app.vercel.app` | Preview |
| `NEXTAUTH_URL` | `http://localhost:3000` | Development |
| `NEXTAUTH_SECRET` | [Een willekeurige geheime string] | Production, Preview, Development |

**Voorbeeld:**
- `FACEBOOK_CLIENT_ID` = `1234567890123456`
- `FACEBOOK_CLIENT_SECRET` = `abcdef1234567890abcdef1234567890`
- `NEXTAUTH_SECRET` = Genereer met: `openssl rand -base64 32` (of gebruik een willekeurige string)

### 2.4 Redeploy na het toevoegen
- Na het toevoegen van environment variables, moet je **redeployen**
- Ga naar **Deployments** tab
- Klik op de 3 puntjes (⋯) naast de laatste deployment
- Klik op **"Redeploy"**

---

## ✅ Stap 3: Verificatie Checklist

### Facebook Developer Console:
- [ ] App ID genoteerd
- [ ] App Secret genoteerd
- [ ] App Domains ingesteld: `homecheff.nl` en `www.homecheff.nl`
- [ ] Privacy Policy URL ingesteld: `https://homecheff.nl/privacy`
- [ ] Valid OAuth Redirect URIs toegevoegd:
  - [ ] `https://homecheff.nl/api/auth/callback/facebook`
  - [ ] `https://www.homecheff.nl/api/auth/callback/facebook`
  - [ ] `http://localhost:3000/api/auth/callback/facebook`
- [ ] App Mode staat op **"Live"**
- [ ] Facebook Login product is toegevoegd
- [ ] Permissions `email` en `public_profile` zijn toegevoegd

### Vercel Environment Variables:
- [ ] `FACEBOOK_CLIENT_ID` is ingesteld (voor alle environments)
- [ ] `FACEBOOK_CLIENT_SECRET` is ingesteld (voor alle environments)
- [ ] `NEXTAUTH_URL` is ingesteld (voor alle environments)
- [ ] `NEXTAUTH_SECRET` is ingesteld (voor alle environments)
- [ ] Project is gere-deployed na het toevoegen van variabelen

---

## 🧪 Stap 4: Testen

### 4.1 Wacht 5-10 minuten
Facebook heeft tijd nodig om de configuratie te verwerken.

### 4.2 Test op productie:
1. Ga naar: `https://homecheff.nl/login`
2. Klik op **"Inloggen met Facebook"**
3. Je zou naar Facebook moeten worden doorgestuurd
4. Na toestemming zou je terug moeten komen naar `/register?social=true`

### 4.3 Als het niet werkt:
- Open browser console (F12) en kijk naar errors
- Controleer Vercel logs: **Deployments** → Klik op deployment → **"Functions"** tab
- Controleer of alle URLs exact matchen (geen trailing slashes)
- Test in incognito/private browsing mode
- Verwijder Facebook cookies en probeer opnieuw

---

## 🚨 Veelvoorkomende Problemen

### Probleem: "Invalid OAuth Redirect URI"
**Oplossing:**
- Controleer of de redirect URI exact overeenkomt in Facebook Developer Console
- Geen trailing slashes (`/`) aan het einde
- Wacht 5-10 minuten na het toevoegen

### Probleem: "App Not Setup"
**Oplossing:**
- Zet App Mode op **"Live"** in Facebook Developer Console
- Voeg Privacy Policy URL toe

### Probleem: "No email provided"
**Oplossing:**
- Controleer of `email` permission is toegevoegd in Facebook Login settings
- Controleer of gebruiker email heeft gedeeld met Facebook

### Probleem: Login werkt lokaal maar niet op productie
**Oplossing:**
- Controleer of `NEXTAUTH_URL` correct is ingesteld in Vercel (moet `https://homecheff.nl` zijn)
- Controleer of redirect URI voor productie is toegevoegd in Facebook

---

## 📞 Hulp Nodig?

Als het na deze stappen nog steeds niet werkt:
1. Controleer browser console voor specifieke errors
2. Controleer Vercel function logs
3. Controleer Facebook Developer Console → **Tools** → **Graph API Explorer** om te testen of de app werkt

