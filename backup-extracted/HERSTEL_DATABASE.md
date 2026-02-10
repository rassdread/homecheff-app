# 🔴 CRITIEK: Database Herstel Instructies

## Situatie
De live database met 10+ gebruikers is tijdens migratie verloren gegaan. Alleen de 2 nieuwe admin accounts zijn nog aanwezig.

## ✅ Oplossing: Neon Point-in-Time Restore

### Stap 1: Ga naar Neon Console
1. Open: https://console.neon.tech
2. Log in met je account
3. Selecteer je **homecheff** project

### Stap 2: Check Branch/Backup History
1. Klik op **"Branches"** in het menu
2. Kijk naar de **timeline** / **history**
3. Zoek een moment **vóór vandaag 21:30** (voordat we de admin changes maakten)

### Stap 3: Herstel Database
**Optie A: Point-in-Time Restore**
1. Klik op **"Restore"** of **"Create Branch"**
2. Selecteer tijdstip: **Gisteren 23:59** of eerder
3. Maak een nieuwe branch van die oude staat
4. Update je `DATABASE_URL` naar de nieuwe branch URL

**Optie B: Rollback Migration**
1. Check Neon dashboard voor automatische backups
2. Als je Pro plan hebt: gebruik PITR (Point-in-Time Recovery)
3. Herstel naar een moment vóór de admin changes

### Stap 4: Update Connection String
Na restore, update je `.env`:
```bash
# Haal de nieuwe connection string uit Neon Console
DATABASE_URL="postgresql://[nieuwe-branch-url]"
DIRECT_URL="postgresql://[nieuwe-branch-url]"
```

### Stap 5: Run Prisma
```bash
npx prisma db pull
npx prisma generate
```

## Alternatief: Als Neon geen Backup heeft

### Optie 1: Check Vercel Deployments
Als je app op Vercel draaide, check **oude deployments**:
- Ga naar Vercel Dashboard
- Kijk naar **Recent Deployments**  
- Mogelijk staat daar een oudere database snapshot

### Optie 2: Check Local Backups
Zoek op je computer:
```powershell
# Zoek naar .sql backups
Get-ChildItem -Recurse -Filter "*.sql" | Select-Object FullName, LastWriteTime

# Check je Download folder
Get-ChildItem ~/Downloads -Filter "*backup*"
```

### Optie 3: Rebuild from Scratch
Als geen backup bestaat:
1. Gegevens zijn helaas verloren
2. Start opnieuw met de 2 admin accounts
3. Voer staging/production scheiding in

## 🔒 Voorkom dit in de toekomst

### 1. Alleen Migraties op DEV eerst testen
```bash
# Gebruik een DEV database voor testing
# Pas daarna toe op PROD
```

### 2. Backup Strategy
- **Local:** Maak regelmatig `.sql` dumps
- **Neon Pro:** Gebruik automatische backups
- **Vercel:** Houd deployment history bij

### 3. Migration Safety
```bash
# Check DATABASE_URL voordat je migreert!
echo $DATABASE_URL

# Test eerst in een branch
npx prisma migrate dev --name test_changes --create-only
```

---

## 🚨 IMMEDIATE ACTION REQUIRED

**JA of NEE: Heb je een backup of oudere database state?**

Als JA:
- Stuur me de backup locatie
- Of geef Neon Console access

Als NEE:
- Dan zijn gegevens helaas verloren
- We moeten opnieuw beginnen

