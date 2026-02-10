# Redirect URI Validator - Uitleg

## ❌ Dit is NIET waar je de URIs moet toevoegen!

De **"Redirect URI Validator"** is een **test tool** om te controleren of een redirect URI correct is geconfigureerd. Dit is NIET de plek waar je de redirect URIs moet instellen.

---

## 🔍 Wat is dit?

Dit is een **validator tool** die je kunt gebruiken om te testen of een specifieke redirect URI correct werkt. Het is handig voor debugging, maar niet waar je de URIs configureert.

---

## ✅ Waar moet je WEL de URIs toevoegen?

Je moet terug naar de **"Valid OAuth Redirect URIs"** sectie die je eerder zag.

### Stappen:

1. **Ga terug** naar de pagina waar je het grote tekstveld zag met "Valid OAuth Redirect URIs"
2. **Scroll naar beneden** als je deze validator ziet - de instellingen staan eronder
3. **Zoek het veld** "Valid OAuth Redirect URIs" (het grote tekstveld)
4. **Voeg daar de URLs toe** (niet in de validator!)

---

## 📍 Locatie van de juiste instellingen:

**Je moet zijn op de pagina:**
- **Use Cases** → **Facebook Login** → **Settings**
- Sectie: **"Valid OAuth Redirect URIs"** (groot tekstveld)
- Sectie: **"Allowed Domains for the JavaScript SDK"**

**NIET:**
- ❌ "Redirect URI Validator" (dit is alleen voor testen)

---

## 🎯 Wat je moet doen:

1. **Scroll naar beneden** op de pagina waar je nu bent
2. **Zoek de sectie** "Valid OAuth Redirect URIs" (met het grote tekstveld)
3. **Voeg daar de URLs toe:**
   ```
   https://homecheff.nl/api/auth/callback/facebook
   https://www.homecheff.nl/api/auth/callback/facebook
   http://localhost:3000/api/auth/callback/facebook
   ```
4. **Zoek de sectie** "Allowed Domains for the JavaScript SDK"
5. **Voeg daar de domeinen toe:**
   ```
   homecheff.nl
   www.homecheff.nl
   homecheff-app.vercel.app
   ```
6. **Klik op "Save Changes"**

---

## 💡 Wanneer gebruik je de Validator?

De validator kun je gebruiken **NA** het toevoegen van de URIs om te testen of ze correct werken. Maar eerst moet je ze toevoegen in het "Valid OAuth Redirect URIs" veld.

---

## ✅ Samenvatting:

- ❌ **Redirect URI Validator** = Alleen voor testen, niet voor configureren
- ✅ **Valid OAuth Redirect URIs** (groot tekstveld) = Hier voeg je de URLs toe
- ✅ **Scroll naar beneden** om de juiste sectie te vinden





