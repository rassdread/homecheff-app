# Mac Troubleshooting Guide

## 🚨 Veelvoorkomende Fouten en Oplossingen

### 1. **Next.js Image Component Fouten**

#### "hasMatch is not a function" of "srcSet did not match"
Dit is een bekende bug in Next.js 14.2.35 met de Image component.

**Oplossing:**
```bash
# Option 1: Clean build en restart
rm -rf .next node_modules
npm install --legacy-peer-deps
npm run dev

# Option 2: Als het blijft, update Next.js (optioneel)
npm install next@latest --legacy-peer-deps
```

**Tijdelijke workaround:**
De Logo component gebruikt nu `unoptimized` in development mode om deze fout te voorkomen.

### 2. **Git Clone Fouten**

#### "Permission denied (publickey)"
```bash
# Check of je SSH key is toegevoegd aan GitHub
ssh -T git@github.com

# Als het niet werkt, gebruik HTTPS in plaats van SSH:
git clone https://github.com/rassdread/homecheff-app.git
```

#### "Repository not found"
- Check of je ingelogd bent met het juiste GitHub account
- Check of je toegang hebt tot de repository
- Gebruik HTTPS in plaats van SSH als je geen SSH key hebt

### 3. **Node.js Fouten**

#### "Command not found: node"
```bash
# Check of Node.js geïnstalleerd is
node -v

# Als niet geïnstalleerd, installeer via Homebrew:
brew install node@18

# Of via NVM (aanbevolen):
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.zshrc  # of ~/.bash_profile
nvm install 18.18.0
nvm use 18.18.0
```

#### "Wrong Node version"
```bash
# Gebruik NVM om de juiste versie te selecteren
nvm use 18.18.0

# Check .nvmrc bestand in project root
cat .nvmrc  # Moet 18.18.0 zijn
```

### 4. **npm install Fouten**

#### "EACCES: permission denied"
```bash
# Fix npm permissions (gebruik GEEN sudo!)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
source ~/.zshrc
```

#### "npm ERR! code ERESOLVE"
```bash
# Gebruik legacy peer deps (zoals in package.json staat)
npm install --legacy-peer-deps
```

#### "Module not found" errors
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### 5. **Permission Fouten**

#### "Permission denied" bij scripts
```bash
# Maak scripts executable
chmod +x apply.sh
chmod +x vercel-ignore-build.sh
chmod +x scripts/*.sh
```

#### "zsh: command not found: ./apply.sh"
```bash
# Check of script executable is
ls -l apply.sh

# Maak executable
chmod +x apply.sh
```

### 6. **Environment Variabelen Fouten**

#### "DATABASE_URL is not defined"
```bash
# Check of .env.local bestaat
ls -la .env.local

# Als niet bestaat, maak het aan:
touch .env.local
nano .env.local
# Plak hier je environment variabelen van Windows
```

#### "NEXTAUTH_SECRET is missing"
- Check of alle environment variabelen in `.env.local` staan
- Kopieer `.env.local` van Windows naar Mac (handmatig)

### 7. **Prisma Fouten**

#### "Prisma Client not generated"
```bash
# Genereer Prisma client
npx prisma generate
```

#### "Migration errors"
```bash
# Als je een lokale database gebruikt:
npx prisma migrate dev

# Als je een remote database gebruikt (zoals Neon):
# Run alleen generate, migrations worden op Vercel gedaan
npx prisma generate
```

### 8. **Build Fouten**

#### "Build failed" of "Out of memory"
```bash
# Clean build
rm -rf .next node_modules
npm install --legacy-peer-deps
npm run build
```

#### "lightningcss" of "@tailwindcss" errors
```bash
# Deze zijn al opgelost in next.config.mjs
# Als je ze toch ziet:
rm -rf .next node_modules
npm install --legacy-peer-deps
npm run build
```

### 9. **Development Server Fouten**

#### "Port 3000 already in use"
```bash
# Zoek wat poort 3000 gebruikt
lsof -ti:3000

# Kill het proces
kill -9 $(lsof -ti:3000)

# Of gebruik een andere poort
PORT=3001 npm run dev
```

#### "Cannot find module" tijdens dev
```bash
# Herstart development server
# Stop met Ctrl+C
npm run dev
```

### 10. **Translation Fouten**

#### "[i18n] Translation key not found"
Dit zijn warnings, geen errors. De app werkt nog steeds.
- Missing keys worden automatisch gelogd
- Je kunt ze later toevoegen aan `public/i18n/nl.json` en `public/i18n/en.json`

### 11. **Git Fouten**

#### "Merge conflicts"
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

#### "Authentication failed"
```bash
# Check remote URL
git remote -v

# Als HTTPS, gebruik Personal Access Token als wachtwoord
# Zie docs/GITHUB_AUTHENTICATIE.md voor instructies
```

### 12. **Vercel CLI Fouten**

#### "Command not found: vercel"
```bash
# Installeer Vercel CLI
npm i -g vercel

# Login
vercel login
```

#### "Project not found"
```bash
# Link project
vercel link

# Of deploy direct
vercel --prod
```

## 🔍 Diagnose Stappen

### Stap 1: Check Basis Vereisten
```bash
# Check Node.js
node -v  # Moet 18.18.0+ zijn

# Check npm
npm -v  # Moet 9.0.0+ zijn

# Check Git
git --version
```

### Stap 2: Check Project Setup
```bash
# Check of je in project directory bent
pwd
ls -la

# Check of .env.local bestaat
ls -la .env.local

# Check of node_modules bestaat
ls -la node_modules
```

### Stap 3: Check Dependencies
```bash
# Check package.json
cat package.json | grep -A 5 "engines"

# Check of dependencies geïnstalleerd zijn
npm list --depth=0
```

### Stap 4: Test Build
```bash
# Test build lokaal
npm run build

# Als build werkt, test dev server
npm run dev
```

## 📋 Quick Fix Checklist

Als je fouten krijgt, probeer deze stappen in volgorde:

1. **Clean install:**
   ```bash
   rm -rf node_modules package-lock.json .next
   npm install --legacy-peer-deps
   ```

2. **Check Node versie:**
   ```bash
   node -v  # Moet 18.18.0+ zijn
   nvm use  # Als je NVM gebruikt
   ```

3. **Check .env.local:**
   ```bash
   ls -la .env.local
   # Als niet bestaat, maak aan met variabelen van Windows
   ```

4. **Genereer Prisma:**
   ```bash
   npx prisma generate
   ```

5. **Fix permissions:**
   ```bash
   chmod +x apply.sh vercel-ignore-build.sh scripts/*.sh
   ```

6. **Test build:**
   ```bash
   npm run build
   ```

7. **Test dev:**
   ```bash
   npm run dev
   ```

## 🆘 Hulp Nodig?

Als je specifieke foutmeldingen hebt:

1. **Kopieer de volledige foutmelding**
2. **Noteer waar het gebeurt** (clone, install, build, dev)
3. **Check deze guide** voor de specifieke fout
4. **Check de andere guides:**
   - `docs/MAC_SETUP.md` - Eerste setup
   - `docs/PROJECT_OVERZETTEN_MAC.md` - Overzetting
   - `docs/WERKEN_OP_BEIDE_PLATFORMS.md` - Workflow

## 💡 Tips

- **Gebruik altijd `--legacy-peer-deps`** bij npm install (zoals in package.json)
- **Check Node versie regelmatig** - moet 18.18.0+ zijn
- **Backup .env.local** in password manager
- **Clean build bij problemen** - `rm -rf .next node_modules && npm install`
- **Check logs** - foutmeldingen bevatten vaak hints
- **Image errors zijn vaak warnings** - de app werkt meestal nog steeds
