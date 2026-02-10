# 📋 Volledige Restore Plan

## ⚠️ PROBLEEM:
- **Producten zijn zichtbaar** ✅
- **Gebruikers kunnen NIET inloggen** ❌
- Database schema mist nieuwe kolommen (`emailVerificationCode`, `adminRoles`, etc.)

## 🎯 PLAN:

### STAP 1: Restore Database naar 17:00 PM
**DOEL:** Gebruikersdata terugkrijgen

**IN NEON CONSOLE:**
1. Klik op **"Restore"** van **production** branch
2. Voer in: `Oct 28, 2025 17:00:00.000 PM`
3. Klik "Proceed"
4. Wacht op restore

**VERWACHT RESULTAAT:**
- ✅ Producten terug
- ✅ Gebruikers terug (kunnen weer inloggen!)
- ❌ Admin functionaliteit weg

### STAP 2: Voeg Nieuwe Kolommen Toe
**DOEL:** Admin velden toevoegen zonder data te verliezen

**RUN:**
```bash
npx prisma db push
```

Dit voegt de missing kolommen toe:
- `emailVerificationCode`
- `emailVerificationExpires`
- `adminRoles`
- Plus nieuwe tabellen: AdminPreferences, AdminPermissions

**RIESICO:** Laag - we voegen alleen kolommen toe, geen data wordt gewist

### STAP 3: Maak Admin Accounts
**DOEL:** Admin functionaliteit toevoegen

**RUN:**
```bash
node scripts/create-admin-accounts.js
```

Dit maakt:
- `admin@homecheff.eu` als SUPERADMIN
- `admin@homecheff.nl` als ADMIN met alle rollen

**RIESICO:** Geen - we voegen alleen nieuwe accounts toe

### STAP 4: Test!
- ✅ Inloggen met bestaande accounts
- ✅ Producten zien
- ✅ Admin functionaliteit gebruiken

## 🎯 DIRECTE ACTIE:

**GA NU NAAR NEON CONSOLE:**
- Klik op "Restore" 
- Voer in: `Oct 28, 2025 17:00:00.000 PM`
- Klik "Proceed"

Daarna stuur ik de volgende stappen!

