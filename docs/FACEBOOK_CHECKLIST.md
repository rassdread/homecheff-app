# Facebook Login - Wat Mis Je Nog? Checklist

## ✅ Code is Klaar
- ✅ Facebook provider is geconfigureerd in `lib/auth.ts`
- ✅ Facebook login buttons zijn aanwezig op `/login` en `/register`
- ✅ Redirect logic is correct ingesteld
- ✅ Onboarding flow is geïmplementeerd

---

## 🔍 Wat Je Moet Controleren

### 1. Facebook Developer Console (https://developers.facebook.com/)

#### A. App Settings → Basic
- [ ] **App ID** is genoteerd (dit is je `FACEBOOK_CLIENT_ID`)
- [ ] **App Secret** is genoteerd (klik op "Show") (dit is je `FACEBOOK_CLIENT_SECRET`)
- [ ] **App Domains** zijn ingesteld:
  ```
  homecheff.nl
  www.homecheff.nl
  ```
- [ ] **Privacy Policy URL** is ingesteld: `https://homecheff.nl/privacy`
- [ ] **Website** is ingesteld: `https://homecheff.nl`
- [ ] **App Mode** staat op **"Live"** (NIET Development!)

#### B. Products → Facebook Login → Settings
- [ ] **Valid OAuth Redirect URIs** zijn toegevoegd (één per regel):
  ```
  https://homecheff.nl/api/auth/callback/facebook
  https://www.homecheff.nl/api/auth/callback/facebook
  http://localhost:3000/api/auth/callback/facebook
  ```
- [ ] Geen trailing slashes (`/`) aan het einde van URLs
- [ ] Alle URLs zijn exact zoals hierboven (geen variaties)

#### C. Products → Facebook Login → Permissions and Features
- [ ] `email` permission is toegevoegd
- [ ] `public_profile` permission is toegevoegd

---

### 2. Vercel Environment Variables (https://vercel.com/)

Ga naar: **Je Project** → **Settings** → **Environment Variables**

#### Voor Production:
- [ ] `FACEBOOK_CLIENT_ID` = [Je App ID uit Facebook]
- [ ] `FACEBOOK_CLIENT_SECRET` = [Je App Secret uit Facebook]
- [ ] `NEXTAUTH_URL` = `https://homecheff.nl`
- [ ] `NEXTAUTH_SECRET` = [Een willekeurige geheime string]

#### Voor Preview:
- [ ] `FACEBOOK_CLIENT_ID` = [Zelfde als Production]
- [ ] `FACEBOOK_CLIENT_SECRET` = [Zelfde als Production]
- [ ] `NEXTAUTH_URL` = `https://homecheff-app.vercel.app`
- [ ] `NEXTAUTH_SECRET` = [Zelfde als Production]

#### Voor Development:
- [ ] `FACEBOOK_CLIENT_ID` = [Zelfde als Production]
- [ ] `FACEBOOK_CLIENT_SECRET` = [Zelfde als Production]
- [ ] `NEXTAUTH_URL` = `http://localhost:3000`
- [ ] `NEXTAUTH_SECRET` = [Zelfde als Production]

#### Na het toevoegen:
- [ ] **Redeploy** je project (Deployments → ⋯ → Redeploy)

---

### 3. Test Checklist

Na alle instellingen:

- [ ] **Wacht 5-10 minuten** (Facebook cache tijd)
- [ ] Test op `https://homecheff.nl/login`
- [ ] Klik op "Inloggen met Facebook"
- [ ] Je wordt doorgestuurd naar Facebook
- [ ] Na toestemming kom je terug naar `/register?social=true`
- [ ] Onboarding formulier wordt getoond met vooringevulde gegevens

---

## 🚨 Veelvoorkomende Problemen

### Probleem: "Development Mode" foutmelding
**Oplossing:** Zet App Mode op **"Live"** in Facebook Developer Console

### Probleem: "Invalid OAuth Redirect URI"
**Oplossing:** 
- Controleer of redirect URI exact overeenkomt
- Geen trailing slashes (`/`)
- Wacht 5-10 minuten na het toevoegen

### Probleem: "No email provided"
**Oplossing:**
- Controleer of `email` permission is toegevoegd
- Controleer of gebruiker email heeft gedeeld met Facebook

### Probleem: Login werkt lokaal maar niet op productie
**Oplossing:**
- Controleer of `NEXTAUTH_URL` correct is ingesteld in Vercel
- Controleer of redirect URI voor productie is toegevoegd in Facebook

---

## 📝 Snelle Verificatie

Open je browser console (F12) en kijk naar:
- ❌ Errors met "Facebook" of "OAuth"
- ❌ "Invalid redirect URI"
- ❌ "App not setup"
- ✅ Geen errors = alles werkt!

---

## 🆘 Als Het Nog Steeds Niet Werkt

1. **Controleer Vercel Logs:**
   - Ga naar Vercel → Deployments → Klik op deployment → Functions tab
   - Zoek naar errors met "Facebook" of "OAuth"

2. **Controleer Browser Console:**
   - Open F12 → Console tab
   - Zoek naar specifieke errors

3. **Test in Incognito Mode:**
   - Open een incognito/private browsing venster
   - Test opnieuw (om cookies uit te sluiten)

4. **Verwijder Facebook Cookies:**
   - Verwijder alle Facebook cookies
   - Test opnieuw

5. **Controleer Facebook Graph API Explorer:**
   - Ga naar Facebook Developer Console → Tools → Graph API Explorer
   - Test of je app werkt





