# Facebook "App Authentication" Sectie - Uitleg

## 🚨 Belangrijk: Dit is NIET voor Web Apps!

De sectie **"App authentication"** die je ziet is **alleen voor native apps** (iOS, Android) of desktop apps.

---

## ❌ Wat je NIET moet doen:

### "Native or desktop app?" Toggle
- **Laat deze UIT** (off/uitgeschakeld)
- Dit is alleen voor native apps, niet voor web apps zoals homecheff.nl

### "Authorize callback URL" veld
- **Laat dit leeg** of vul het NIET in
- Dit is alleen voor native apps
- Dit is NIET hetzelfde als "Valid OAuth Redirect URIs"

---

## ✅ Waar je WEL de redirect URIs moet instellen:

Voor een **web app** zoals homecheff.nl, moet je de redirect URIs instellen in een **andere sectie**:

### Stap 1: Ga naar Facebook Login Settings
1. Ga naar: **Use Cases** → Klik op de **"Facebook Login"** card → **Settings**
   - Je ziet een card met de titel "Authenticate and request data from users with Facebook Login"
   - Klik op deze card of op het potlood icoon rechtsboven
2. (NIET naar Settings → Basic → App authentication)

### Stap 2: Zoek "Valid OAuth Redirect URIs"
- Dit staat in de **Facebook Login Settings** pagina
- NIET in de "App authentication" sectie

### Stap 3: Voeg deze URLs toe (één per regel):
```
https://homecheff.nl/api/auth/callback/facebook
https://www.homecheff.nl/api/auth/callback/facebook
http://localhost:3000/api/auth/callback/facebook
```

---

## 📋 Waar moet je WEL instellen:

### ✅ Settings → Basic:
- App Domains
- Website URL
- Privacy Policy URL
- App Mode (Live/Development)

### ✅ Use Cases → Facebook Login → Settings:
- **Valid OAuth Redirect URIs** ← HIER moet je de redirect URLs toevoegen!
- Klik op de "Facebook Login" card in de Use Cases sectie

### ❌ Settings → Basic → App authentication:
- **NIET gebruiken** voor web apps
- Alleen voor native/desktop apps

---

## 🔍 Verschil tussen de twee:

| Veld | Locatie | Voor | Gebruik voor homecheff.nl? |
|------|---------|------|---------------------------|
| **Authorize callback URL** | Settings → Basic → App authentication | Native/Desktop apps | ❌ NEE |
| **Valid OAuth Redirect URIs** | Use Cases → Facebook Login → Settings | Web apps | ✅ JA |

---

## ✅ Samenvatting:

**Voor homecheff.nl (web app):**
- ❌ "Native or desktop app?" toggle → **UIT laten**
- ❌ "Authorize callback URL" → **Leeg laten**
- ✅ "Valid OAuth Redirect URIs" → **HIER de URLs toevoegen**

**Locatie van "Valid OAuth Redirect URIs":**
- Use Cases → Klik op "Facebook Login" card → Settings → Valid OAuth Redirect URIs

