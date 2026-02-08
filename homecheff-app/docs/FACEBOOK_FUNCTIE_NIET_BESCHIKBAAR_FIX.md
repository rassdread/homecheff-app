# Facebook "Functie niet beschikbaar" Foutmelding - Oplossing

## 🚨 Foutmelding:
**"Aanmelden via Facebook is momenteel niet beschikbaar voor deze app, omdat we bezig zijn aanvullende details voor deze app bij te werken."**

---

## ✅ Wat betekent dit?

Dit is een **tijdelijke melding** die betekent dat Facebook je app-instellingen nog aan het verwerken is. Dit gebeurt vaak na het maken van wijzigingen.

---

## 🔍 Mogelijke Oorzaken:

### 1. Recente Wijzigingen
- Je hebt net redirect URIs toegevoegd
- Facebook heeft tijd nodig om deze te verwerken (5-30 minuten)

### 2. Ontbrekende App Details
- Privacy Policy URL niet ingesteld
- App Domains niet ingesteld
- Website URL niet ingesteld

### 3. App Mode
- App staat nog in Development mode (moet op Live)

---

## ✅ Oplossingen:

### Stap 1: Controleer App Settings → Basic

Ga naar: **Settings** → **Basic** en controleer:

- [ ] **Privacy Policy URL** is ingesteld: `https://homecheff.nl/privacy`
- [ ] **App Domains** zijn ingesteld:
  ```
  homecheff.nl
  www.homecheff.nl
  ```
- [ ] **Website** is ingesteld: `https://homecheff.nl`
- [ ] **App Mode** staat op **"Live"** (niet Development!)

### Stap 2: Wacht 15-30 minuten

Na het instellen van bovenstaande:
- **Wacht 15-30 minuten** (Facebook heeft tijd nodig om alles te verwerken)
- **Test opnieuw** op `https://homecheff.nl/login`

### Stap 3: Controleer App Review Status

Ga naar: **App Review** → **Permissions and Features**

- Controleer of alle vereiste informatie is ingevuld
- Zorg dat je app op **"Live"** staat

---

## ⏰ Tijdlijn:

- **Direct na wijzigingen:** Foutmelding (normaal)
- **Na 5-10 minuten:** Meestal opgelost
- **Na 15-30 minuten:** Zou zeker moeten werken
- **Na 1 uur:** Als het nog steeds niet werkt, controleer alle instellingen opnieuw

---

## 🔍 Checklist:

**Settings → Basic:**
- [ ] Privacy Policy URL: `https://homecheff.nl/privacy`
- [ ] App Domains: `homecheff.nl` en `www.homecheff.nl`
- [ ] Website: `https://homecheff.nl`
- [ ] App Mode: **Live** (niet Development)

**Use Cases → Facebook Login → Settings:**
- [ ] Valid OAuth Redirect URIs zijn toegevoegd
- [ ] Allowed Domains zijn toegevoegd
- [ ] "Save Changes" is geklikt

---

## 💡 Wat te doen nu:

1. **Controleer alle instellingen** hierboven
2. **Zorg dat alles is opgeslagen** (klik op "Save Changes" overal)
3. **Wacht 15-30 minuten**
4. **Test opnieuw** in een incognito/private browsing venster
5. **Verwijder Facebook cookies** en test opnieuw

---

## 🚨 Als het na 1 uur nog steeds niet werkt:

1. Controleer of alle URLs exact kloppen (geen trailing slashes)
2. Controleer of App Mode op "Live" staat
3. Test met een andere browser
4. Controleer Vercel logs voor server-side errors
5. Controleer browser console (F12) voor client-side errors

---

## ✅ Meest Waarschijnlijke Oorzaak:

**App Mode staat nog op "Development"** of **Privacy Policy URL ontbreekt**.

**Oplossing:**
- Ga naar Settings → Basic
- Zet App Mode op **"Live"**
- Voeg Privacy Policy URL toe: `https://homecheff.nl/privacy`
- Wacht 15-30 minuten
- Test opnieuw





