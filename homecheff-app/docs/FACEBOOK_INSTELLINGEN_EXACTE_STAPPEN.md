# Facebook Login Instellingen - Exacte Stappen

## ✅ Je bent op de juiste pagina!

Je ziet nu de Facebook Login Settings pagina. Hier moet je 2 dingen instellen:

---

## 📝 Stap 1: Valid OAuth Redirect URIs

**Locatie:** Het grote tekstveld onder "Valid OAuth Redirect URIs"

**Voeg deze URLs toe (één per regel):**
```
https://homecheff.nl/api/auth/callback/facebook
https://www.homecheff.nl/api/auth/callback/facebook
http://localhost:3000/api/auth/callback/facebook
```

**Belangrijk:**
- ✅ Één URL per regel
- ✅ Geen trailing slash (`/`) aan het einde
- ✅ Exact zoals hierboven geschreven

---

## 📝 Stap 2: Allowed Domains for the JavaScript SDK

**Locatie:** Het tekstveld onder "Allowed Domains for the JavaScript SDK"

**Je ziet nu:** `https://homecheff-app.vercel.app/`

**Voeg deze domeinen toe:**
```
homecheff.nl
www.homecheff.nl
homecheff-app.vercel.app
```

**Belangrijk:**
- ✅ Geen `http://` of `https://` voor de domeinen
- ✅ Geen trailing slash (`/`) aan het einde
- ✅ Alleen het domein zelf (bijvoorbeeld: `homecheff.nl`)

**Let op:** Als er al `https://homecheff-app.vercel.app/` staat, verwijder dan de `https://` en `/` zodat het alleen `homecheff-app.vercel.app` is.

---

## ⚙️ Stap 3: Use Strict Mode

**Locatie:** De toggle "Use Strict Mode for redirect URIs"

**Zet deze op:** ✅ **"Yes"** (aanbevolen voor veiligheid)

Dit zorgt ervoor dat alleen exacte matches van je redirect URIs worden toegestaan.

---

## 📋 Complete Checklist voor deze pagina:

- [ ] **Valid OAuth Redirect URIs** - Alle 3 URLs toegevoegd:
  - [ ] `https://homecheff.nl/api/auth/callback/facebook`
  - [ ] `https://www.homecheff.nl/api/auth/callback/facebook`
  - [ ] `http://localhost:3000/api/auth/callback/facebook`

- [ ] **Allowed Domains for the JavaScript SDK** - Alle 3 domeinen toegevoegd:
  - [ ] `homecheff.nl`
  - [ ] `www.homecheff.nl`
  - [ ] `homecheff-app.vercel.app`

- [ ] **Use Strict Mode** - Op **"Yes"** gezet

- [ ] **Klik op "Save Changes"** onderaan de pagina

---

## ✅ Na het opslaan:

1. **Wacht 5-10 minuten** (Facebook cache tijd)
2. **Test op** `https://homecheff.nl/login`
3. **Klik op "Inloggen met Facebook"**

---

## 🚨 Veelvoorkomende Fouten:

### ❌ FOUT in Valid OAuth Redirect URIs:
```
https://homecheff.nl/api/auth/callback/facebook/
https://homecheff.nl/api/auth/callback/facebook (trailing space)
```

### ✅ GOED:
```
https://homecheff.nl/api/auth/callback/facebook
https://www.homecheff.nl/api/auth/callback/facebook
http://localhost:3000/api/auth/callback/facebook
```

### ❌ FOUT in Allowed Domains:
```
https://homecheff.nl
https://www.homecheff.nl/
```

### ✅ GOED:
```
homecheff.nl
www.homecheff.nl
homecheff-app.vercel.app
```





