# Facebook Website URL - Correctie

## 🚨 Wat je nu hebt:
**Site URL:** `http://homecheff.nl/`

## ❌ Problemen:
1. **`http://`** moet **`https://`** zijn (voor productie)
2. **Trailing slash (`/`)** aan het einde moet weg

---

## ✅ Wat het moet zijn:

**Site URL:** `https://homecheff.nl`

**Belangrijk:**
- ✅ Gebruik **`https://`** (niet `http://`)
- ✅ **Geen** trailing slash (`/`) aan het einde
- ✅ Alleen de hoofddomein URL

---

## 📋 Stappen om te fixen:

1. **Klik in het veld** "Site URL"
2. **Verwijder** `http://` en vervang door `https://`
3. **Verwijder** de trailing slash (`/`) aan het einde
4. **Zorg dat het exact is:** `https://homecheff.nl`
5. **Klik op "Save Changes"** onderaan de pagina

---

## ✅ Correcte Configuratie:

### Website → Site URL:
```
https://homecheff.nl
```

### App Domains:
```
homecheff.nl
www.homecheff.nl
```

### Valid OAuth Redirect URIs:
```
https://homecheff.nl/api/auth/callback/facebook
https://www.homecheff.nl/api/auth/callback/facebook
http://localhost:3000/api/auth/callback/facebook
```

---

## 💡 Waarom HTTPS?

- **Productie websites** moeten HTTPS gebruiken (veiligheid)
- Facebook vereist HTTPS voor productie apps
- `http://` werkt alleen voor development/localhost

---

## ✅ Samenvatting:

**Verander:**
- `http://homecheff.nl/` ❌

**Naar:**
- `https://homecheff.nl` ✅

Klik op "Save Changes" en je bent klaar!





