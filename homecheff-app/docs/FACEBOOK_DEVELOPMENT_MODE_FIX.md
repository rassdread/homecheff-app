# Facebook "Development Mode" Foutmelding Oplossen

## 🚨 Probleem
Je ziet deze foutmelding:
```
Stop! Dit is een browserfunctie die is bedoeld voor ontwikkelaars...
```

Dit betekent dat je Facebook app nog in **Development Mode** staat.

---

## ✅ Oplossing: App op Live Mode Zetten

### Stap 1: Ga naar Facebook Developer Console
1. Open: https://developers.facebook.com/
2. Log in met je Facebook account
3. Klik op **"My Apps"** → Selecteer je app

### Stap 2: Zet App Mode op "Live"
1. Ga naar **Settings** → **Basic**
2. Scroll helemaal naar beneden
3. Zoek **"App Mode"** sectie
4. Klik op de switch om van **"Development"** naar **"Live"** te zetten

⚠️ **BELANGRIJK**: Je moet eerst deze dingen instellen voordat je op Live kunt zetten:

### Vereisten voor Live Mode:

#### 1. Privacy Policy URL (VERPLICHT)
- Ga naar **Settings** → **Basic**
- Scroll naar **"Privacy Policy URL"**
- Voeg toe: `https://homecheff.nl/privacy`
- Klik op **"Save Changes"**

#### 2. App Domains (VERPLICHT)
- In dezelfde **Settings** → **Basic** pagina
- Zoek **"App Domains"**
- Voeg toe:
  ```
  homecheff.nl
  www.homecheff.nl
  ```
- Klik op **"Save Changes"**

#### 3. Valid OAuth Redirect URIs (VERPLICHT)
- Ga naar **Products** → **Facebook Login** → **Settings**
- Zoek **"Valid OAuth Redirect URIs"**
- Voeg deze toe (één per regel):
  ```
  https://homecheff.nl/api/auth/callback/facebook
  https://www.homecheff.nl/api/auth/callback/facebook
  http://localhost:3000/api/auth/callback/facebook
  ```
- Klik op **"Save Changes"**

#### 4. Website URL (VERPLICHT)
- Ga naar **Settings** → **Basic**
- Zoek **"Website"** sectie
- Voeg toe: `https://homecheff.nl`
- Klik op **"Save Changes"**

### Stap 3: Zet App Mode op Live
Na het instellen van bovenstaande:
1. Ga terug naar **Settings** → **Basic**
2. Scroll naar beneden naar **"App Mode"**
3. Klik op de switch om naar **"Live"** te zetten
4. Bevestig de waarschuwing

---

## 🔄 Alternatief: Testers Toevoegen (Als je nog niet Live kunt)

Als je nog niet alle vereisten hebt voor Live mode, kun je tijdelijk testers toevoegen:

### Testers Toevoegen:
1. Ga naar **Roles** → **Roles** in het linker menu
2. Klik op **"Add People"**
3. Voeg Facebook accounts toe die kunnen testen:
   - **Role**: "Developer" of "Tester"
   - Voeg je eigen Facebook account toe
   - Voeg andere test accounts toe
4. Klik op **"Submit"**

⚠️ **LET OP**: Dit is alleen een tijdelijke oplossing. Voor productie moet je app op Live staan.

---

## ✅ Verificatie

Na het instellen:

1. **Wacht 5-10 minuten** (Facebook cache)
2. **Test opnieuw**:
   - Ga naar: `https://homecheff.nl/login`
   - Klik op "Inloggen met Facebook"
   - De foutmelding zou nu weg moeten zijn

---

## 🚨 Als het nog steeds niet werkt:

### Controleer:
1. **App Mode staat op Live** (niet Development)
2. **Privacy Policy URL is ingesteld**
3. **App Domains zijn ingesteld**
4. **Redirect URIs zijn toegevoegd**
5. **Website URL is ingesteld**

### Debug:
- Test in **incognito/private browsing** mode
- Verwijder Facebook cookies en probeer opnieuw
- Controleer browser console voor andere errors
- Controleer Vercel logs voor server-side errors

---

## 📝 Snelle Checklist

**Facebook Developer Console:**
- [ ] Privacy Policy URL: `https://homecheff.nl/privacy`
- [ ] App Domains: `homecheff.nl` en `www.homecheff.nl`
- [ ] Website URL: `https://homecheff.nl`
- [ ] Redirect URIs zijn toegevoegd
- [ ] App Mode staat op **"Live"** (niet Development)

**Vercel:**
- [ ] `FACEBOOK_CLIENT_ID` is ingesteld
- [ ] `FACEBOOK_CLIENT_SECRET` is ingesteld
- [ ] `NEXTAUTH_URL` is ingesteld op `https://homecheff.nl`
- [ ] Project is gere-deployed





