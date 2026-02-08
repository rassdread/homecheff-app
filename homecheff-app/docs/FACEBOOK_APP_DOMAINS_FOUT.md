# Facebook App Domains Fout - Oplossing

## 🚨 Foutmelding:
**"Must contain a top level domain (like '.com', or '.org') directly after its name."**

---

## ❌ Wat is er mis?

De domeinen in "App domains" zijn niet correct ingevuld. Je ziet waarschijnlijk afgekorte domeinen zoals:
- `ho...` (incomplete)
- `ww...` (incomplete)
- `loca...` (incomplete - localhost werkt hier niet!)

---

## ✅ Wat moet je invullen in "App domains"?

**Locatie:** Settings → Basic → **App domains**

**Voeg deze toe (één per regel):**
```
homecheff.nl
www.homecheff.nl
```

**BELANGRIJK:**
- ✅ **GEEN** `http://` of `https://`
- ✅ **GEEN** trailing slash (`/`)
- ✅ **GEEN** `localhost` (dit werkt niet voor App Domains!)
- ✅ Alleen het volledige domein met top-level domain (`.nl`)

---

## ❌ Wat NIET te doen:

### FOUT:
```
http://homecheff.nl
https://www.homecheff.nl
homecheff.nl/
localhost
localhost:3000
```

### GOED:
```
homecheff.nl
www.homecheff.nl
```

---

## 📋 Stappen om te fixen:

### Stap 1: Verwijder alle foute entries
- Klik op de **X** naast elke foute entry om ze te verwijderen
- Verwijder vooral `localhost` entries (die werken hier niet)

### Stap 2: Voeg correcte domeinen toe
- Klik op **"Add domain"** of het **+** icoon
- Voeg toe: `homecheff.nl`
- Klik opnieuw op **"Add domain"**
- Voeg toe: `www.homecheff.nl`

### Stap 3: Controleer
- Zorg dat je alleen ziet:
  - `homecheff.nl`
  - `www.homecheff.nl`
- Geen rode border meer
- Geen foutmelding

### Stap 4: Opslaan
- Klik op **"Save Changes"** onderaan de pagina

---

## 🔍 Waarom localhost niet werkt:

**App Domains** zijn alleen voor **productie domeinen**. `localhost` hoort hier niet thuis.

**localhost** gebruik je alleen in:
- ✅ **Valid OAuth Redirect URIs** (daar mag `http://localhost:3000/api/auth/callback/facebook`)
- ❌ **NIET** in App Domains

---

## ✅ Correcte Configuratie:

### App Domains (Settings → Basic):
```
homecheff.nl
www.homecheff.nl
```

### Valid OAuth Redirect URIs (Use Cases → Facebook Login → Settings):
```
https://homecheff.nl/api/auth/callback/facebook
https://www.homecheff.nl/api/auth/callback/facebook
http://localhost:3000/api/auth/callback/facebook
```

---

## 💡 Samenvatting:

1. **Verwijder** alle foute entries (vooral `localhost`)
2. **Voeg toe:** `homecheff.nl` en `www.homecheff.nl`
3. **Geen** `http://` of `https://`
4. **Geen** trailing slash
5. **Klik op "Save Changes"**

Na het opslaan zou de rode border moeten verdwijnen en zou de foutmelding weg moeten zijn.





