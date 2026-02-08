# Facebook Basic Settings - Checklist

## ✅ Wat Goed Is:

### App Domains
- ✅ `homecheff.nl`
- ✅ `www.homecheff.nl`
- **Perfect!** Geen localhost, correct formaat

### User Data Deletion
- ✅ `https://homecheff.nl/privacy`
- **Correct!** Gebruikt HTTPS

### Terms of Service URL
- ✅ `https://homecheff.nl/terms`
- **Correct!** Gebruikt HTTPS

### Contact Email
- ✅ `r.sergioarrias@gmail.com`
- **Correct!** Geldig email adres

### Category
- ✅ "Shopping"
- **Correct!** Past bij de app

### App Icon
- ✅ Icoon is zichtbaar
- **Correct!** App heeft een icoon

---

## ❌ Wat Moet Worden Aangepast:

### Privacy Policy URL
- ❌ **Nu:** `http://homecheff.nl/privacy`
- ✅ **Moet zijn:** `https://homecheff.nl/privacy`

**Probleem:** Gebruikt `http://` in plaats van `https://`

**Waarom belangrijk:**
- Facebook vereist HTTPS voor productie apps
- `http://` kan problemen veroorzaken bij het op "Live" zetten
- Veiligheid: HTTPS is verplicht voor privacy policy URLs

---

## 📋 Stappen om te Fixen:

1. **Klik op het veld** "Privacy policy URL"
2. **Verander** `http://` naar `https://`
3. **Zorg dat het exact is:** `https://homecheff.nl/privacy`
4. **Klik op "Save Changes"** onderaan de pagina

---

## ✅ Complete Checklist:

- [x] App Domains: `homecheff.nl` en `www.homecheff.nl`
- [ ] **Privacy Policy URL:** `https://homecheff.nl/privacy` (moet worden aangepast!)
- [x] User Data Deletion: `https://homecheff.nl/privacy`
- [x] Terms of Service URL: `https://homecheff.nl/terms`
- [x] Contact Email: `r.sergioarrias@gmail.com`
- [x] Category: Shopping
- [x] App Icon: Aanwezig

---

## 🎯 Na het Aanpassen:

1. **Klik op "Save Changes"**
2. **Wacht 5-10 minuten** (Facebook cache)
3. **Controleer of App Mode op "Live" staat** (Settings → Basic → App Mode)
4. **Test Facebook login** op `https://homecheff.nl/login`

---

## 💡 Belangrijk:

Alle URLs moeten **HTTPS** gebruiken voor productie apps. Alleen `localhost` mag `http://` gebruiken (en alleen in development mode).





