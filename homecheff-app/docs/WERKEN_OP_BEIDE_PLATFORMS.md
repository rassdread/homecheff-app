# Werken op Beide Platforms (Windows + Mac)

## ✅ Ja, je kunt op beide machines bouwen!

Het project is volledig cross-platform geconfigureerd, dus je kunt zonder problemen op zowel Windows als Mac werken.

## 🔄 Aanbevolen Workflow

### **Dagelijkse Workflow**

#### **Voor je stopt met werken (op Windows of Mac):**

```bash
# 1. Check status
git status

# 2. Commit alle wijzigingen (maar NIET .env bestanden!)
git add .
git commit -m "Beschrijving van wat je hebt gedaan"

# 3. Push naar GitHub (geen automatische deployment!)
git push origin main

# 4. Deploy naar Vercel (handmatig, als je wilt)
vercel --prod
```

**Let op:** `.env.local` wordt automatisch genegeerd door `.gitignore` - deze wordt NIET gecommit!

#### **Voor je begint met werken (op andere machine):**

```bash
# 1. Pull laatste wijzigingen
git pull origin main

# 2. Installeer nieuwe dependencies (als die er zijn)
npm install

# 3. Start development
npm run dev
```

## 📋 Platform-specifieke Commands

### **Build Commands (werken op beide):**

```bash
# Development server (beide platforms)
npm run dev

# Production build (beide platforms)
npm run build

# Start production server (beide platforms)
npm run start
```

### **Platform-specifieke Scripts:**

**Windows:**
- `apply.ps1` - PowerShell script voor patches
- `scripts\remove_conflicts.ps1` - PowerShell conflict removal

**Mac/Linux:**
- `apply.sh` - Bash script voor patches
- `scripts/remove_conflicts.sh` - Bash conflict removal

**Beide:**
- Alle andere scripts werken op beide platforms

## 🔐 Environment Variabelen Synchroniseren

**⚠️ BELANGRIJK:** `.env.local` moet op beide machines hetzelfde zijn!

### **Optie 1: Handmatig Synchroniseren**

1. **Bij wijzigingen op Windows:**
   - Kopieer inhoud van `.env.local`
   - Plak in `.env.local` op Mac

2. **Bij wijzigingen op Mac:**
   - Kopieer inhoud van `.env.local`
   - Plak in `.env.local` op Windows

### **Optie 2: Veilige Cloud Backup**

**Gebruik een password manager of encrypted storage:**
- 1Password Secure Notes
- Bitwarden
- Encrypted cloud storage (Cryptomator)

**Workflow:**
1. Update `.env.local` op één machine
2. Kopieer naar password manager
3. Haal op andere machine uit password manager

### **Optie 3: Environment Template (Zonder Secrets)**

Maak een `.env.example` bestand (mag wel gecommit worden):

```env
# Database
DATABASE_URL="your-database-url-here"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_..."
STRIPE_SECRET_KEY="sk_..."

# ... andere variabelen zonder echte waarden
```

**Gebruik:**
```bash
# Op nieuwe machine
cp .env.example .env.local
# Vul dan de echte waarden in
```

## 🚨 Voorkomen van Conflicten

### **1. Commit Regelmatig**

**Slecht:**
- Werken 3 dagen zonder commit
- Dan push en merge conflicts

**Goed:**
- Elke dag committen
- Kleine, logische commits
- Regelmatig pushen

### **2. Pull Voordat Je Begint**

**Altijd eerst pullen:**
```bash
git pull origin main
```

**Voorkomt:**
- Merge conflicts
- Oude code overschrijven
- Verloren werk

### **3. Gebruik Branches voor Experimenten**

```bash
# Maak een branch voor experimentele features
git checkout -b feature/nieuwe-feature

# Werk op de branch
# ... maak wijzigingen ...

# Commit en push branch
git push origin feature/nieuwe-feature

# Merge later naar main
```

## 🔧 Platform-specifieke Setup

### **Windows Setup:**

```bash
# Check Node.js versie
node -v  # Moet 18.18.0+ zijn

# Installeer dependencies
npm install

# Maak .env.local (als je die nog niet hebt)
# Kopieer uit password manager of van Mac
```

### **Mac Setup:**

```bash
# Check Node.js versie (via NVM)
nvm use  # Gebruikt .nvmrc (18.18.0)

# Installeer dependencies
npm install

# Maak shell scripts executable
chmod +x apply.sh vercel-ignore-build.sh scripts/*.sh

# Maak .env.local (als je die nog niet hebt)
# Kopieer uit password manager of van Windows
```

## 📦 Wat Moet Gelijk Zijn op Beide Machines

### **✅ Moet hetzelfde zijn:**
- `.env.local` - Environment variabelen
- `package.json` - Dependencies (via Git)
- `package-lock.json` - Dependency versies (via Git)
- Alle source code (via Git)

### **❌ Mag verschillen:**
- `node_modules/` - Wordt automatisch geïnstalleerd
- `.next/` - Build cache, wordt opnieuw gebouwd
- Platform-specifieke configuratie (zoals Android SDK paths)

## 🐛 Troubleshooting

### **"Module not found" op één machine**

```bash
# Herinstalleer dependencies
rm -rf node_modules package-lock.json
npm install
```

### **Git merge conflicts**

```bash
# Pull met rebase
git pull --rebase origin main

# Los conflicten op in editor
# Markeer conflicten en kies juiste versie

# Voeg opgeloste bestanden toe
git add .

# Continue rebase
git rebase --continue
```

### **Environment variabelen werken niet**

1. Check of `.env.local` bestaat
2. Check of variabelen correct zijn (geen quotes rondom waarden nodig)
3. Herstart development server: `npm run dev`

### **Build werkt op één machine maar niet op andere**

```bash
# Clean build
rm -rf .next node_modules
npm install
npm run build
```

### **"Permission denied" op Mac scripts**

```bash
chmod +x apply.sh vercel-ignore-build.sh scripts/*.sh
```

## ✅ Best Practices Checklist

### **Elke Dag:**

- [ ] Pull voordat je begint: `git pull origin main`
- [ ] Commit voordat je stopt: `git add . && git commit -m "..." && git push`
- [ ] Check `git status` regelmatig

### **Bij Platform Switch:**

- [ ] Pull laatste wijzigingen
- [ ] `npm install` (als package.json gewijzigd is)
- [ ] Verifieer `.env.local` is up-to-date
- [ ] Test: `npm run dev` werkt

### **Bij Nieuwe Dependencies:**

- [ ] `npm install <package>` op één machine
- [ ] Commit `package.json` en `package-lock.json`
- [ ] Push naar GitHub
- [ ] Op andere machine: `git pull && npm install`

## 💡 Tips

1. **Gebruik Git branches** voor experimentele features
2. **Commit kleine, logische wijzigingen** - makkelijker om conflicten op te lossen
3. **Pull regelmatig** - voorkom grote merge conflicts
4. **Backup `.env.local`** in password manager
5. **Test build op beide machines** - voorkom platform-specifieke bugs

## 🔄 Voorbeeld Workflow

### **Maandag - Werken op Windows:**

```bash
# Ochtend
git pull origin main
npm run dev
# ... werk de hele dag ...

# Avond
git add .
git commit -m "Nieuwe feature X toegevoegd"
git push origin main
```

### **Dinsdag - Werken op Mac:**

```bash
# Ochtend
git pull origin main  # Haalt maandag's werk op
npm install  # Als er nieuwe dependencies zijn
npm run dev
# ... werk de hele dag ...

# Avond
git add .
git commit -m "Feature X verbeterd"
git push origin main
```

### **Woensdag - Terug op Windows:**

```bash
# Ochtend
git pull origin main  # Haalt dinsdag's werk op
npm run dev
# ... alles werkt perfect! ...
```

## 📚 Gerelateerde Documenten

- [Project Overzetten naar Mac](PROJECT_OVERZETTEN_MAC.md)
- [Mac Setup Guide](MAC_SETUP.md)
- [GitHub Authenticatie](GITHUB_AUTHENTICATIE.md)
- [Veiligheid Checklist](VEILIGHEID_CHECKLIST.md)

## 🎯 Samenvatting

**Ja, je kunt op beide machines bouwen!** 

Het project is volledig cross-platform:
- ✅ Alle build commands werken op beide platforms
- ✅ Git synchroniseert code automatisch
- ✅ Dependencies zijn platform-onafhankelijk
- ✅ Alleen `.env.local` moet handmatig gesynchroniseerd worden

**Workflow:**
1. Pull voordat je begint
2. Werk zoals normaal
3. Commit en push voordat je stopt
4. Herhaal op andere machine

Zo simpel is het! 🚀

