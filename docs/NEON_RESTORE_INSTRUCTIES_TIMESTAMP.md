# 🚨 DIRECTE RESTORE INSTRUCTIES - 1 UUR TERUG

## ✅ SITUATIE:
Je hebt data van **1 uur geleden** nodig. Dit is **MOGELIJK** met 1 day retention!

## 📝 STAPPEN IN NEON CONSOLE:

### Stap 1: Vul Timestamp In
Op de "Restore" pagina waar je nu bent:

**In het timestamp veld, voer in:**
```
10/28/2025 20:30:00
```

Of kies een tijdstip:
- **HUIDIGE TIJD:** 21:52 (ongeveer)
- **WEG TERUG:** 20:30 - 20:50 (vóór admin changes)
- **VEILIGE TIJD:** 20:00 - 20:30 (zeker vóór alle changes)

### Stap 2: Check Schema Diff (OPTIONEEL)
- Klik op **"Schema Diff"** button (onder timestamp)
- Dit toont wat er anders is
- Dit is OPTIONEEL, maar handig om te zien

### Stap 3: Time Travel Assist (OPTIONEEL)
```
Check first!
Run read-only queries at the selected timestamp to preview data
Confirm you've chosen the right point in time before you restore
```

**Dit betekent:**
- Je kunt FIRST data bekijken op dat tijdstip
- VOORDAT je de restore doet
- Zo weet je zeker dat je de goede tijd kiest

### Stap 4: Execute Restore
Als je de juiste tijd hebt:
- Klik op **"Proceed"** button
- Bevestig de restore
- Wacht op completion

### Stap 5: Update Connection
Na restore:
- Je hebt een nieuwe branch state
- Update je `.env.local` (niet nodig - gebruikt al development)
- Herstart je app

## ⚠️ BELANGRIJK:

**Je zit op de "development" branch!**

**VRAGEN:**
1. **Wat staat er in het timestamp veld op dit moment?**
2. **Zie je "Proceed" button enabled (niet grijs)?**
3. **Kun je een timestamp typen?**

**MOGELIJKE PROBLEMEN:**
- Als "Proceed" grijs is → je moet EERST een timestamp invullen
- Als geen history beschikbaar → development branch heeft geen historie
- Als foutmelding → proberen met "production" branch

## 🎯 DIRECTE ACTIE:

**OP DE PAGINA WAAR JE NU BENT:**
1. **Typ een tijdstip in het timestamp veld:**
   - Formaat: `MM/DD/YYYY HH:MM:SS`
   - Bijvoorbeeld: `10/28/2025 20:30:00`
2. **Klik op "Time travel assist"** om FIRST data te preview
3. **Als data OK is:** Klik "Proceed"
4. **Wacht op restore**
5. **Check met: `node scripts/check-branch-data.js`**

## 💡 ALTERNATIEF: Probeer Production Branch

Mogelijk staat data in "production" branch:
1. **Switch naar "production" branch** (dropdown bovenaan)
2. **Ga naar Restore** van production
3. **Herhaal bovenstaande stappen**

---

**VOER NU IN: `10/28/2025 20:30:00` in het timestamp veld en laat me weten wat er gebeurt!**

