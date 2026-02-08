# Meta (Facebook) Domeinen Configuratie - Complete Gids

## 📋 Overzicht
Dit document bevat alle domeinen die je moet toevoegen in Facebook Developer Console voor homecheff.nl.

---

## 🔧 Stap 1: App Domains (Settings → Basic)

**Locatie:** Facebook Developer Console → Settings → Basic → **App Domains**

**Voeg deze toe (één per regel):**
```
homecheff.nl
www.homecheff.nl
```

⚠️ **BELANGRIJK:**
- Voeg **GEEN** `http://` of `https://` toe
- Voeg **GEEN** trailing slash (`/`) toe
- Alleen het domein zelf

---

## 🔧 Stap 2: Valid OAuth Redirect URIs (Products → Facebook Login → Settings)

**Locatie:** Facebook Developer Console → Products → Facebook Login → Settings → **Valid OAuth Redirect URIs**

**Voeg deze toe (één per regel):**
```
https://homecheff.nl/api/auth/callback/facebook
https://www.homecheff.nl/api/auth/callback/facebook
http://localhost:3000/api/auth/callback/facebook
```

⚠️ **BELANGRIJK:**
- Voeg **WEL** `https://` of `http://` toe (voor localhost)
- Voeg **GEEN** trailing slash (`/`) aan het einde toe
- Exact deze URLs, geen variaties
- Volledige pad inclusief `/api/auth/callback/facebook`

---

## 🔧 Stap 3: Website URL (Settings → Basic)

**Locatie:** Facebook Developer Console → Settings → Basic → **Website**

**Voeg deze toe:**
```
https://homecheff.nl
```

⚠️ **BELANGRIJK:**
- Voeg **WEL** `https://` toe
- Voeg **GEEN** trailing slash (`/`) toe
- Alleen de hoofddomein URL

---

## 🔧 Stap 4: Privacy Policy URL (Settings → Basic)

**Locatie:** Facebook Developer Console → Settings → Basic → **Privacy Policy URL**

**Voeg deze toe:**
```
https://homecheff.nl/privacy
```

⚠️ **BELANGRIJK:**
- Voeg **WEL** `https://` toe
- Volledige pad naar je privacy pagina

---

## 🔧 Stap 5: Terms of Service URL (Settings → Basic) - Optioneel

**Locatie:** Facebook Developer Console → Settings → Basic → **Terms of Service URL**

**Voeg deze toe (optioneel maar aanbevolen):**
```
https://homecheff.nl/terms
```

---

## 📝 Complete Checklist

### Settings → Basic:
- [ ] **App Domains:**
  - [ ] `homecheff.nl`
  - [ ] `www.homecheff.nl`
- [ ] **Website:**
  - [ ] `https://homecheff.nl`
- [ ] **Privacy Policy URL:**
  - [ ] `https://homecheff.nl/privacy`
- [ ] **Terms of Service URL** (optioneel):
  - [ ] `https://homecheff.nl/terms`

### Products → Facebook Login → Settings:
- [ ] **Valid OAuth Redirect URIs:**
  - [ ] `https://homecheff.nl/api/auth/callback/facebook`
  - [ ] `https://www.homecheff.nl/api/auth/callback/facebook`
  - [ ] `http://localhost:3000/api/auth/callback/facebook`

---

## 🚨 Veelvoorkomende Fouten

### ❌ FOUT:
```
App Domains:
https://homecheff.nl
http://www.homecheff.nl
homecheff.nl/
```

### ✅ GOED:
```
App Domains:
homecheff.nl
www.homecheff.nl
```

---

### ❌ FOUT:
```
Valid OAuth Redirect URIs:
https://homecheff.nl/api/auth/callback/facebook/
homecheff.nl/api/auth/callback/facebook
```

### ✅ GOED:
```
Valid OAuth Redirect URIs:
https://homecheff.nl/api/auth/callback/facebook
https://www.homecheff.nl/api/auth/callback/facebook
http://localhost:3000/api/auth/callback/facebook
```

---

## 📋 Snelle Referentie Tabel

| Instelling | Locatie | Format | Voorbeeld |
|------------|---------|--------|-----------|
| **App Domains** | Settings → Basic | Geen protocol | `homecheff.nl` |
| **Website** | Settings → Basic | Met https:// | `https://homecheff.nl` |
| **Privacy Policy** | Settings → Basic | Volledige URL | `https://homecheff.nl/privacy` |
| **Redirect URIs** | Products → Facebook Login → Settings | Volledige URL | `https://homecheff.nl/api/auth/callback/facebook` |

---

## ✅ Na het Toevoegen

1. **Klik op "Save Changes"** na elke wijziging
2. **Wacht 5-10 minuten** (Facebook cache tijd)
3. **Test opnieuw** op `https://homecheff.nl/login`

---

## 🔍 Verificatie

Na het instellen, controleer:
- [ ] Geen errors in Facebook Developer Console
- [ ] Alle URLs zijn exact zoals hierboven
- [ ] App Mode staat op **"Live"** (niet Development)
- [ ] Geen trailing slashes aan het einde





