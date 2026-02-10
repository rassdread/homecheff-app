# Facebook Login via Use Cases - Stap voor Stap

## ✅ Je bent op de juiste plek!

Je ziet nu de **"Use cases"** sectie met de **"Facebook Login"** card. Dit is de juiste plek!

---

## 📋 Stappen om Facebook Login in te stellen:

### Stap 1: Klik op de Facebook Login Card
- Je ziet een grote witte card met:
  - Titel: "Authenticate and request data from users with Facebook Login"
  - Facebook logo links
  - Potlood icoon rechtsboven
- **Klik op deze card** of op het **potlood icoon** rechtsboven

### Stap 2: Ga naar Settings
- Na het klikken op de card, ga je naar de Facebook Login configuratie pagina
- Klik op **"Settings"** in het linker menu (of bovenin de pagina)

### Stap 3: Voeg Valid OAuth Redirect URIs toe
- Zoek het veld **"Valid OAuth Redirect URIs"**
- Voeg deze URLs toe (één per regel):
  ```
  https://homecheff.nl/api/auth/callback/facebook
  https://www.homecheff.nl/api/auth/callback/facebook
  http://localhost:3000/api/auth/callback/facebook
  ```
- Klik op **"Save Changes"**

### Stap 4: Controleer Permissions
- Ga naar **"Permissions and Features"** (in hetzelfde menu)
- Zorg dat deze permissions zijn toegevoegd:
  - ✅ `email`
  - ✅ `public_profile`

---

## 🎯 Wat je nu ziet:

- ✅ **"Use cases"** sectie (dit is hetzelfde als "Products" in de oude interface)
- ✅ **"Facebook Login"** card met beschrijving
- ✅ Potlood icoon om te bewerken

---

## ⚠️ Belangrijk:

- **NIET** naar "App authentication" in Settings → Basic gaan
- **WEL** naar "Use Cases" → "Facebook Login" → "Settings" gaan
- Dit is de juiste plek voor web apps zoals homecheff.nl

---

## ✅ Volgende Stappen:

1. Klik op de **"Facebook Login"** card
2. Ga naar **"Settings"**
3. Voeg de **Valid OAuth Redirect URIs** toe
4. Klik op **"Save Changes"**
5. Wacht 5-10 minuten (Facebook cache)
6. Test op `https://homecheff.nl/login`





